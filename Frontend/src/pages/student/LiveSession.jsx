
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import api from '../../api/client';
import { useUser } from '../../context/UserContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Maximize2, Minimize2, MoreVertical, Send, Monitor, Smile, X, RefreshCw } from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import './LiveSession.css';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const LiveSession = () => {
    const { user } = useUser();
    const { showAlert } = useAlert();
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [isMuted, setIsMuted] = useState(() => sessionStorage.getItem('isMuted') === 'true');
    const [isVideoOff, setIsVideoOff] = useState(() => sessionStorage.getItem('isVideoOff') === 'true');
    const [seconds, setSeconds] = useState(0);
    const [mediaError, setMediaError] = useState(null);

    // Sidebar State
    const [activeTab, setActiveTab] = useState('context');
    const [sessionDetails, setSessionDetails] = useState(null);
    const [floatingMessages, setFloatingMessages] = useState([]);

    // Fetch Session Details
    useEffect(() => {
        const fetchSessionDetails = async () => {
            if (!sessionId) return;
            try {
                const res = await api.get(`/session-requests/${sessionId}`);
                setSessionDetails(res.data);
                // Also optionally set room ID from session details if dynamic
                // setRoomId(res.data.roomId || 'demo-room');
            } catch (err) {
                console.error("Failed to fetch session details:", err);
            }
        };
        fetchSessionDetails();
    }, [sessionId]);

    // Media Refs
    const videoRef = useRef(null); // Local Video
    const remoteVideoRef = useRef(null); // Remote Video
    const streamRef = useRef(null);
    const containerRef = useRef(null); // Ref for full-screen container
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const sourceRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Drawing Refs
    const canvasRef = useRef(null);

    // Canvas Logic (Render Only)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleResize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const drawLine = (start, end, color, width) => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const canvas = canvasRef.current;

        ctx.beginPath();
        // De-normalize coordinates
        ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
        ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    // WebRTC & Socket Refs
    const socketRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [roomId, setRoomId] = useState(sessionId || 'demo-room'); // Default room for now
    const [instructorName, setInstructorName] = useState('');
    const [startTime, setStartTime] = useState(null);

    const [audioLevel, setAudioLevel] = useState(0);

    // Interaction State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const [floatingReactions, setFloatingReactions] = useState([]);

    // Keep track of latest user state without triggering re-renders of the socket effect
    const userRef = useRef(user);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
                setShowReactions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleReaction = (emoji) => {
        const id = Date.now() + Math.random();
        // Random position between 10% and 90%
        const left = 10 + Math.random() * 80;

        setFloatingReactions(prev => [...prev, { id, emoji, left }]);

        // Emit to server for instructor
        if (socketRef.current) {
            socketRef.current.emit('send-reaction', {
                roomId,
                emoji
            });
        }

        // Remove after animation (2s)
        setTimeout(() => {
            setFloatingReactions(prev => prev.filter(r => r.id !== id));
        }, 2000);

        // Close picker after selection (optional, keeping open for spamming reactions is fun)
        // setShowReactions(false); 
        // setIsMenuOpen(false); 
    };

    // Initialize Media Stream & WebRTC
    useEffect(() => {
        let isMounted = true;
        const startMediaAndSocket = async () => {
            try {
                // 1. Get User Media
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

                if (!isMounted) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                // Apply persisted states immediately
                const storedMute = sessionStorage.getItem('isMuted') === 'true';
                const storedVideoOff = sessionStorage.getItem('isVideoOff') === 'true';

                if (storedMute) {
                    stream.getAudioTracks().forEach(track => track.enabled = false);
                }

                if (storedVideoOff) {
                    stream.getVideoTracks().forEach(track => {
                        track.enabled = false;
                        track.stop();
                        stream.removeTrack(track);
                    });
                }

                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                // Audio Analysis Setup
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const analyser = audioCtx.createAnalyser();
                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);
                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                audioContextRef.current = audioCtx;
                analyserRef.current = analyser;
                dataArrayRef.current = dataArray;
                sourceRef.current = source;

                const updateVolume = () => {
                    if (analyserRef.current && dataArrayRef.current) {
                        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                        let sum = 0;
                        for (let i = 0; i < dataArrayRef.current.length; i++) {
                            sum += dataArrayRef.current[i];
                        }
                        const average = sum / dataArrayRef.current.length;
                        const level = Math.min(100, Math.max(0, average * 2));
                        setAudioLevel(level);
                    }
                    animationFrameRef.current = requestAnimationFrame(updateVolume);
                };
                updateVolume();
                setMediaError(null);

                // 2. Initialize Socket Connection
                socketRef.current = io(SOCKET_SERVER_URL, { withCredentials: true });

                // Helper to create Peer Connection
                const createPeerConnection = () => {
                    // Check if exists and active
                    if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'closed') {
                        return peerConnectionRef.current;
                    }

                    const pc = new RTCPeerConnection({
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:stun1.l.google.com:19302' },
                            { urls: 'stun:stun2.l.google.com:19302' },
                            { urls: 'stun:stun3.l.google.com:19302' },
                            { urls: 'stun:stun4.l.google.com:19302' },
                            { urls: 'stun:global.stun.twilio.com:3478' }
                        ]
                    });

                    pc.onicecandidate = (event) => {
                        if (event.candidate) {
                            socketRef.current.emit('ice-candidate', {
                                roomId,
                                candidate: event.candidate
                            });
                        }
                    };

                    pc.ontrack = (event) => {
                        console.log("Received remote track");
                        setRemoteStream(event.streams[0]);
                    };

                    // Add local tracks
                    if (streamRef.current) {
                        streamRef.current.getTracks().forEach(track => {
                            pc.addTrack(track, streamRef.current);
                        });
                    }

                    pc.oniceconnectionstatechange = () => {
                        console.log("ICE Connection State:", pc.iceConnectionState);
                        setConnectionStatus(pc.iceConnectionState);
                    };

                    peerConnectionRef.current = pc;
                    return pc;
                };

                const candidateQueue = [];
                let isRemoteDescriptionSet = false;

                const addCandidateToQueue = (candidate) => {
                    if (isRemoteDescriptionSet && peerConnectionRef.current) {
                        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
                            .catch(e => console.error("Error adding ice candidate", e));
                    } else {
                        candidateQueue.push(candidate);
                    }
                };

                const flushCandidateQueue = async () => {
                    isRemoteDescriptionSet = true;
                    if (peerConnectionRef.current) {
                        while (candidateQueue.length > 0) {
                            const candidate = candidateQueue.shift();
                            try {
                                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                            } catch (e) {
                                console.error("Error flushing candidate", e);
                            }
                        }
                    }
                };

                // Socket Event Listeners
                socketRef.current.on('connect_error', (err) => {
                    console.error("[LiveSession] Socket connection error:", err);
                    setMediaError(`Connection failed: ${err.message}`);
                });

                socketRef.current.on('connect', () => {
                    console.log("Connected to socket server");
                    socketRef.current.emit('join-room', roomId, 'user-' + Math.floor(Math.random() * 10000));

                    // Optimistically request offer in case Instructor is already there (Refresh scenario)
                    socketRef.current.emit('request-offer', {
                        roomId,
                        userId: socketRef.current.id,
                        studentName: userRef.current?.name || 'Student'
                    });
                });

                socketRef.current.on('user-connected', async (userId) => {
                    console.log("User connected:", userId);
                    if (userId.startsWith('observer-')) return;

                    // Hard Reset: Close existing PC to ensure fresh negotiation
                    if (peerConnectionRef.current) {
                        console.log("Closing existing peer connection due to new user connection");
                        peerConnectionRef.current.close();
                        peerConnectionRef.current = null;
                        setRemoteStream(null); // Clear video
                        isRemoteDescriptionSet = false;
                        candidateQueue.length = 0;
                    }

                    // Instead of offering, request the instructor to offer
                    socketRef.current.emit('request-offer', {
                        roomId,
                        userId: socketRef.current.id,
                        studentName: userRef.current?.name || 'Student'
                    });
                });

                socketRef.current.on('end-session', () => {
                    showAlert('The instructor has ended the session.', 'info');
                    navigate('/student/feedback', {
                        state: {
                            sessionId,
                            instructorId: sessionDetails?.instructorId?._id || sessionDetails?.instructorId || sessionDetails?.instructorId?._id
                        }
                    });
                });

                socketRef.current.on('offer', async (payload) => {
                    console.log("Received Offer from:", payload.instructorName);
                    if (payload.instructorName) {
                        setInstructorName(payload.instructorName);
                    }
                    if (payload.startTime) {
                        setStartTime(payload.startTime);
                    }

                    // Hard Reset: If we receive an offer, it means a new negotiation session.
                    // Close any existing PC to prevent state mismatch (m-line order errors).
                    if (peerConnectionRef.current) {
                        console.log("Closing existing peer connection before accepting new offer");
                        peerConnectionRef.current.close();
                        peerConnectionRef.current = null;
                    }

                    isRemoteDescriptionSet = false;
                    candidateQueue.length = 0;

                    const pc = createPeerConnection(); // This will create a NEW one now that ref is null

                    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                    await flushCandidateQueue();

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    socketRef.current.emit('answer', {
                        roomId,
                        sdp: answer
                    });
                });

                socketRef.current.on('answer', async (payload) => {
                    console.log("Received Answer");
                    const pc = peerConnectionRef.current;
                    if (pc && pc.signalingState !== 'stable') {
                        try {
                            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                            await flushCandidateQueue();
                        } catch (err) {
                            console.error("Error setting remote description:", err);
                        }
                    }
                });

                socketRef.current.on('ice-candidate', async (payload) => {
                    if (payload.candidate) {
                        const pc = peerConnectionRef.current;
                        if (!pc || !pc.remoteDescription) {
                            addCandidateToQueue(payload.candidate);
                        } else {
                            try {
                                await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                            } catch (e) {
                                console.error("Error adding ice candidate", e);
                            }
                        }
                    }
                });

                socketRef.current.on('receive-message', (data) => {
                    setMessages(prev => [...prev, data]);

                    // Add floating message bubble if it's from the other user
                    if (data.sender !== 'Me' && data.sender !== (user?.name)) {
                        const id = Date.now();
                        setFloatingMessages(prev => [...prev, { id, message: data.message, sender: data.sender }]);
                        setTimeout(() => {
                            setFloatingMessages(prev => prev.filter(m => m.id !== id));
                        }, 5000);
                    }
                });

                socketRef.current.on('sync-time', (payload) => {
                    // Legacy sync-time, keeping for backward compatibility if needed, 
                    // but mainly relying on timer-sync now.
                    if (payload.startTime) {
                        setStartTime(payload.startTime);
                    }
                });

                socketRef.current.on('timer-sync', (payload) => {
                    setTimerState({
                        accumulated: payload.accumulated,
                        lastResume: payload.lastResume
                    });
                });

                // Drawing Events
                socketRef.current.on('draw-line', (payload) => {
                    drawLine(payload.prevPoint, payload.currentPoint, payload.color, payload.width);
                });

                socketRef.current.on('clear-canvas', () => {
                    clearCanvas();
                });

            } catch (err) {
                console.error("Error accessing media devices:", err);
                setMediaError("Could not access camera/microphone");
            }
        };

        startMediaAndSocket();

        return () => {
            isMounted = false;
            // Cleanup
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) audioContextRef.current.close();
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [roomId]);

    // Re-attach stream to video element when it mounts (e.g. after turning camera back on)
    useEffect(() => {
        if (!isVideoOff && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isVideoOff]);

    // Debugging: Log remote stream changes
    useEffect(() => {
        console.log("[LiveSession] Remote stream updated:", remoteStream ? `Stream ID: ${remoteStream.id}, Tracks: ${remoteStream.getTracks().length}` : "null");

        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            // Explicitly attempt to play to catch Autoplay errors
            remoteVideoRef.current.play().catch(e => {
                console.error("[LiveSession] Error playing remote video:", e);
                setMediaError("Autoplay blocked: Click anywhere to enable video.");
            });
        }
    }, [remoteStream]);

    // ... inside socket setup ...
    // Note: I cannot easily inject inside the big useEffect without replace_file code that matches specific blocks.
    // I will target the socket event listeners specifically if I can, or use the logging effect above.
    // To debugging signaling, I'll rely on the existing console.logs but ensure they are verbose enough.

    // Toggle Mute
    // Toggle Mute
    const toggleMute = () => {
        setIsMuted(prev => {
            const newMutedState = !prev;
            if (streamRef.current) {
                streamRef.current.getAudioTracks().forEach(track => {
                    track.enabled = !newMutedState;
                });
            }
            sessionStorage.setItem('isMuted', newMutedState.toString());
            return newMutedState;
        });
    };

    // Toggle Video
    const toggleVideo = async () => {
        if (isVideoOff) {
            // Turning Video ON: Request new stream
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = newStream.getVideoTracks()[0];

                if (streamRef.current) {
                    streamRef.current.addTrack(newVideoTrack);
                } else {
                    streamRef.current = newStream;
                }

                // Update Peer Connection
                if (peerConnectionRef.current) {
                    const senders = peerConnectionRef.current.getSenders();
                    const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                    if (videoSender) {
                        videoSender.replaceTrack(newVideoTrack);
                    } else {
                        peerConnectionRef.current.addTrack(newVideoTrack, streamRef.current);
                    }
                }

                setIsVideoOff(false);
                sessionStorage.setItem('isVideoOff', 'false');
                setMediaError(null);
            } catch (err) {
                console.error("Error restarting video:", err);
                setMediaError("Could not access camera");
            }
        } else {
            // Turning Video OFF: Stop tracks to release camera
            if (streamRef.current) {
                const videoTracks = streamRef.current.getVideoTracks();
                videoTracks.forEach(track => {
                    track.enabled = false;
                    track.stop(); // This should release the hardware
                    streamRef.current.removeTrack(track); // Clean from stream
                });

                // Clear video source
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }

                setIsVideoOff(true);
                sessionStorage.setItem('isVideoOff', 'true');
            }
        }
    };

    // Full Screen Toggle
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            if (containerRef.current) {
                containerRef.current.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const handleReconnect = () => {
        console.log("Manual Reconnect Triggered");
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setRemoteStream(null);
        setConnectionStatus('reconnecting');

        // Re-initiate connection
        if (socketRef.current) {
            socketRef.current.emit('request-offer', {
                roomId,
                userId: socketRef.current.id,
                studentName: userRef.current?.name || 'Student'
            });
        }
    };

    const REACTIONS = ['👍', '❤️', '👏', '🎉', '😂', '😮'];

    // Timer Logic (Server Synced)
    const [timerState, setTimerState] = useState({ accumulated: 0, lastResume: null });

    useEffect(() => {
        let interval;
        if (timerState.lastResume) {
            interval = setInterval(() => {
                const now = Date.now();
                const totalSeconds = Math.floor((timerState.accumulated + (now - timerState.lastResume)) / 1000);
                setSeconds(totalSeconds);
            }, 1000);
        } else {
            // Paused
            setSeconds(Math.floor(timerState.accumulated / 1000));
        }
        return () => clearInterval(interval);
    }, [timerState]);

    // Screen Share Logic
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const handleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];

                // If currently sending video, replace it. If not, add it.
                if (peerConnectionRef.current) {
                    const senders = peerConnectionRef.current.getSenders();
                    const videoSender = senders.find(s => s.track && s.track.kind === 'video');

                    if (videoSender) {
                        videoSender.replaceTrack(screenTrack);
                    } else {
                        peerConnectionRef.current.addTrack(screenTrack, streamRef.current);
                    }
                }

                // Update Local Video View
                if (videoRef.current) {
                    videoRef.current.srcObject = screenStream;
                }

                // Handle "Stop Sharing" from Browser UI
                screenTrack.onended = () => {
                    stopScreenShare();
                };

                setIsScreenSharing(true);
                setIsVideoOff(false); // Consider screen share as "video on"
            } catch (err) {
                console.error("Error starting screen share:", err);
                showAlert("Failed to start screen share.", "error");
            }
        } else {
            stopScreenShare();
        }
    };

    const stopScreenShare = async () => {
        // Revert to Camera
        try {
            const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const videoTrack = cameraStream.getVideoTracks()[0];

            if (peerConnectionRef.current) {
                const senders = peerConnectionRef.current.getSenders();
                const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                if (videoSender) {
                    videoSender.replaceTrack(videoTrack);
                }
            }

            if (videoRef.current) {
                videoRef.current.srcObject = cameraStream;
            }

            // Update ref
            if (streamRef.current) {
                // Stop old screen tracks if any still running (handled by onended usually, but good to be safe)
                // Actually we want to keep the camera stream as the main streamRef
                streamRef.current = cameraStream;
            }

            setIsScreenSharing(false);
            setIsVideoOff(false);
        } catch (err) {
            console.error("Error reverting to camera:", err);
            // If camera fails, just stop screen share and go to video off?
            setIsScreenSharing(false);
            setIsVideoOff(true);
        }
    };

    const handleEndSession = () => {
        showAlert(
            'Are you sure you want to end the session?',
            'confirm',
            () => {
                navigate('/student/feedback', {
                    state: {
                        sessionId,
                        instructorId: sessionDetails?.instructorId?._id || sessionDetails?.instructorId
                    }
                });
            }
        );
    };

    const sendMessage = () => {
        if (!inputText.trim()) return;

        const msgData = {
            roomId,
            message: inputText,
            sender: 'Me',
            time: new Date().toISOString()
        };

        if (socketRef.current) {
            socketRef.current.emit('send-message', msgData);
        }
        setInputText('');
    };

    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Connection Status Debugging
    const [connectionStatus, setConnectionStatus] = useState('initializing');

    return (
        <div className="session-container" ref={containerRef}>
            {/* Main Video Area */}
            <div className="video-area">
                <div className="main-video-feed">
                    <div className="video-overlay-info">
                        <div className="instructor-tag">
                            <span className="live-indicator">LIVE</span>
                            {instructorName || 'Instructor'}
                        </div>
                        <div className="session-timer">
                            {formatTime(seconds)}
                        </div>
                        <div className="connection-status" style={{
                            background: connectionStatus === 'connected' ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: 'white',
                            marginLeft: '8px'
                        }}>
                            Status: {connectionStatus}
                        </div>
                    </div>

                    {/* Drawing Canvas Overlay */}
                    <canvas
                        ref={canvasRef}
                        className="drawing-canvas"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 10,
                            pointerEvents: 'none' // Student cannot draw
                        }}
                    />

                    {/* Floating Reactions Overlay */}
                    <div className="reactions-overlay">
                        {floatingReactions.map(reaction => (
                            <div
                                key={reaction.id}
                                className="floating-reaction"
                                style={{ left: `${reaction.left}%` }}
                            >
                                {reaction.emoji}
                            </div>
                        ))}
                    </div>

                    {/* Floating Messages Overlay */}
                    <div className="floating-messages-overlay">
                        {floatingMessages.map(msg => (
                            <div key={msg.id} className="floating-message-bubble">
                                <div className="floating-avatar">{msg.sender[0]}</div>
                                <div className="floating-text">{msg.message}</div>
                            </div>
                        ))}
                    </div>

                    {/* Remote Video (Instructor) */}
                    <div className="video-placeholder instructor-view">
                        {remoteStream ? (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="remote-video"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <div className="waiting-state">
                                <div className="avatar-large">S</div>
                                <p className="waiting-text">Waiting for instructor...</p>
                            </div>
                        )}
                    </div>

                    {/* Self View (PiP) */}
                    <div className={`self-view ${isVideoOff ? 'camera-off' : ''}`}>
                        {mediaError ? (
                            <div className="media-error-msg">!</div>
                        ) : isVideoOff ? (
                            <div className="avatar-small">You</div>
                        ) : (
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="camera-preview-video"
                            />
                        )}
                    </div>
                </div>

                {/* Video Controls */}
                <div className="session-controls-bar">
                    <div className="mic-button-wrapper" style={{ position: 'relative' }}>
                        <Button
                            variant={isMuted ? 'danger' : 'secondary'}
                            className="control-btn"
                            onClick={toggleMute}
                            style={{ position: 'relative', overflow: 'hidden' }}
                        >
                            {isMuted ? <MicOff size={20} style={{ zIndex: 2, position: 'relative' }} /> : (
                                <>
                                    <Mic size={20} style={{ zIndex: 2, position: 'relative' }} />
                                    {/* Mic Visualizer Overlay */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            width: '100%',
                                            height: `${audioLevel}%`,
                                            backgroundColor: 'rgba(34, 211, 238, 0.5)', // Cyan tint
                                            zIndex: 1,
                                            transition: 'height 0.1s linear'
                                        }}
                                    />
                                </>
                            )}
                        </Button>
                    </div>

                    <Button
                        variant={isVideoOff ? 'danger' : 'secondary'}
                        className="control-btn"
                        onClick={toggleVideo}
                    >
                        {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                    </Button>

                    <Button
                        variant="secondary"
                        className="control-btn"
                        onClick={handleReconnect}
                        title="Reconnect (Fix Frozen/Black Video)"
                    >
                        <RefreshCw size={20} />
                    </Button>

                    <Button
                        variant="secondary"
                        className="control-btn"
                        onClick={toggleFullScreen}
                    >
                        {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </Button>

                    <Button
                        variant={isScreenSharing ? 'active' : 'secondary'}
                        className={`control-btn ${isScreenSharing ? 'sharing-active' : ''}`}
                        title="Share Screen"
                        onClick={handleScreenShare}
                    >
                        <Monitor size={20} color={isScreenSharing ? '#22d3ee' : 'currentColor'} />
                    </Button>

                    <Button variant="danger" className="control-btn end-call-btn" onClick={handleEndSession}>
                        <PhoneOff size={20} />
                        <span>End Session</span>
                    </Button>

                    <div className="controls-menu-wrapper" ref={menuRef}>
                        <Button
                            variant="secondary"
                            className={`control-btn ${isMenuOpen ? 'active' : ''}`}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <MoreVertical size={20} />
                        </Button>

                        {isMenuOpen && (
                            <div className="overflow-menu">
                                {/* Screen Share moved to main bar */}
                                <button
                                    className="menu-item"
                                    onClick={() => setShowReactions(!showReactions)}
                                >
                                    <Smile size={18} />
                                    <span>Reactions</span>
                                </button>

                                {showReactions && (
                                    <div className="reactions-picker">
                                        {REACTIONS.map(emoji => (
                                            <button
                                                key={emoji}
                                                className="reaction-btn"
                                                onClick={() => handleReaction(emoji)}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Side Panel (Doubt Details & Chat) */}
            <div className="session-sidebar">
                <div className="sidebar-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'context' ? 'active' : ''}`}
                        onClick={() => setActiveTab('context')}
                    >
                        Context
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                        onClick={() => setActiveTab('chat')}
                    >
                        Live Chat
                    </button>
                </div>

                <div className="sidebar-content">
                    {activeTab === 'context' ? (
                        <div className="doubt-details-section">
                            {sessionDetails ? (
                                <>
                                    <Badge variant="active" className="mb-2">{sessionDetails.doubtId?.domain || 'General'}</Badge>
                                    <h3 className="doubt-title-Sidebar">{sessionDetails.doubtId?.title || sessionDetails.subject}</h3>
                                    <p className="doubt-desc-sidebar">
                                        "{sessionDetails.doubtId?.description || sessionDetails.message}"
                                    </p>
                                    {sessionDetails.doubtId?.codeSnippet && (
                                        <div className="code-preview-sidebar">
                                            <pre><code>{sessionDetails.doubtId.codeSnippet}</code></pre>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="loading-text">Loading session context...</p>
                            )}
                        </div>
                    ) : (
                        <div className="chat-section">
                            <div className="chat-messages">
                                <div className="chat-msg system">Session started</div>
                                {messages.map((msg, index) => (
                                    <div key={index} className={`chat-msg ${msg.sender === 'Me' ? 'sent' : 'received'}`}>
                                        <strong>{msg.sender}:</strong> {msg.message}
                                    </div>
                                ))}
                            </div>
                            <div className="chat-input-area">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                />
                                <button className="send-btn" onClick={sendMessage}>
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveSession;
