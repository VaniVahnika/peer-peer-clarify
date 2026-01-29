
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import api from '../../api/client';
import { useUser } from '../../context/UserContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Maximize2, Minimize2, MoreVertical, Send, Monitor, PenTool, X, RefreshCw } from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import { updateSessionRequest } from '../../api/sessionRequests';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import './LiveSession.css';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const InstructorLiveSession = () => {
    const { user } = useUser();
    const { showAlert } = useAlert();
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMuted, setIsMuted] = useState(() => sessionStorage.getItem('isMuted') === 'true');
    const [isVideoOff, setIsVideoOff] = useState(() => sessionStorage.getItem('isVideoOff') === 'true');
    const [seconds, setSeconds] = useState(() => {
        const stored = sessionStorage.getItem('startTime');
        return stored ? Math.floor((Date.now() - parseInt(stored)) / 1000) : 0;
    });



    const [mediaError, setMediaError] = useState(null);

    // Media Refs
    const videoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const streamRef = useRef(null);
    const containerRef = useRef(null);

    // WebRTC & Socket Refs
    const socketRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [floatingReactions, setFloatingReactions] = useState([]);
    const [floatingMessages, setFloatingMessages] = useState([]);
    const [studentName, setStudentName] = useState('');

    // Sidebar State
    const [activeTab, setActiveTab] = useState('context');
    const [sessionDetails, setSessionDetails] = useState(null);

    // Session State
    const [isLive, setIsLive] = useState(() => {
        return sessionStorage.getItem('isLive') === 'true';
    });
    const [startTime, setStartTime] = useState(() => {
        const stored = sessionStorage.getItem('startTime');
        return stored ? parseInt(stored) : null;
    });
    const startTimeRef = useRef(startTime); // Sync ref with state for socket closures

    // Drawing Refs & State
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isPenActive, setIsPenActive] = useState(false);
    const prevPoint = useRef(null);

    useEffect(() => {
        startTimeRef.current = startTime;
    }, [startTime]);

    // Canvas Logic
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

    const startDrawing = (e) => {
        if (!isPenActive) return;
        setIsDrawing(true);
        const { offsetX, offsetY } = getCoordinates(e);
        prevPoint.current = { x: offsetX, y: offsetY };
    };

    const draw = (e) => {
        if (!isDrawing || !isPenActive || !prevPoint.current) return;
        const { offsetX, offsetY } = getCoordinates(e);
        const currentPoint = { x: offsetX, y: offsetY };

        drawLine(prevPoint.current, currentPoint, '#22d3ee', 2);

        // Emit drawing event
        if (socketRef.current) {
            socketRef.current.emit('draw-line', {
                roomId,
                prevPoint: normalizePoint(prevPoint.current),
                currentPoint: normalizePoint(currentPoint),
                color: '#22d3ee',
                width: 2
            });
        }

        prevPoint.current = currentPoint;
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        prevPoint.current = null;
    };

    const getCoordinates = (e) => {
        if (e.touches && e.touches[0]) {
            const rect = canvasRef.current.getBoundingClientRect();
            return {
                offsetX: e.touches[0].clientX - rect.left,
                offsetY: e.touches[0].clientY - rect.top
            };
        }
        return { offsetX: e.nativeEvent.offsetX, offsetY: e.nativeEvent.offsetY };
    };

    const drawLine = (start, end, color, width) => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    const normalizePoint = (point) => {
        const canvas = canvasRef.current;
        return {
            x: point.x / canvas.width,
            y: point.y / canvas.height
        };
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (socketRef.current) {
            socketRef.current.emit('clear-canvas', { roomId });
        }
    };

    const roomId = sessionId || 'demo-room';

    // Student Join Timeout Logic (3 minutes)


    // Fetch Session Details
    useEffect(() => {
        const fetchSessionDetails = async () => {
            if (!sessionId) return;
            try {
                const res = await api.get(`/session-requests/${sessionId}`);
                setSessionDetails(res.data);
                if (res.data.studentId && res.data.studentId.name) {
                    setStudentName(res.data.studentId.name);
                }
            } catch (err) {
                console.error("Failed to fetch session details:", err);
            }
        };
        fetchSessionDetails();
    }, [sessionId]);

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
                setMediaError(null);

                // 2. Initialize Socket
                socketRef.current = io(SOCKET_SERVER_URL, { withCredentials: true });
                socketRef.current.emit('instructor-started-stream', { roomId });

                // Initialize Session State if not already set
                if (!sessionStorage.getItem('isLive')) {
                    const now = Date.now();
                    setIsLive(true);
                    setStartTime(now);
                    sessionStorage.setItem('isLive', 'true');
                    sessionStorage.setItem('startTime', now.toString());
                    startTimeRef.current = now;
                }

                // --- WebRTC Logic Scope ---
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

                const createPeerConnection = () => {
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

                // --- Socket Listeners ---
                socketRef.current.on('connect', () => {
                    console.log("Connected to socket server");
                    socketRef.current.emit('join-room', roomId, 'instructor-' + Math.floor(Math.random() * 10000));
                });

                socketRef.current.on('user-connected', (userId) => {
                    console.log("User connected:", userId);
                    if (userId.startsWith('observer-')) return;
                    // Hard Reset: Use this opportunity to clear any stale state
                    if (peerConnectionRef.current) {
                        console.log("Closing existing peer connection due to user-connected event");
                        peerConnectionRef.current.close();
                        peerConnectionRef.current = null;
                        setRemoteStream(null);
                        isRemoteDescriptionSet = false;
                        candidateQueue.length = 0;
                    }
                    // Wait for request-offer from student to avoid glare
                });

                socketRef.current.on('timer-sync', (payload) => {
                    setTimerState({
                        accumulated: payload.accumulated,
                        lastResume: payload.lastResume
                    });
                });

                socketRef.current.on('request-offer', async (payload) => {
                    console.log("Received request-offer from:", payload.studentName);
                    if (payload.studentName) {
                        setStudentName(payload.studentName);
                    } else {
                        setStudentName('Student');
                    }

                    // Hard Reset: Close existing PC to ensure clean state
                    if (peerConnectionRef.current) {
                        console.log("Closing existing peer connection before new offer");
                        peerConnectionRef.current.close();
                        peerConnectionRef.current = null;
                        setRemoteStream(null);
                    }

                    isRemoteDescriptionSet = false;
                    candidateQueue.length = 0;

                    const pc = createPeerConnection();
                    try {
                        const offer = await pc.createOffer({
                            offerToReceiveAudio: true,
                            offerToReceiveVideo: true
                        });
                        await pc.setLocalDescription(offer);
                        socketRef.current.emit('offer', {
                            roomId,
                            sdp: offer,
                            callerId: socketRef.current.id,
                            instructorName: user?.name || 'Instructor',
                            startTime: startTimeRef.current // Use ref to avoid stale closure
                        });
                    } catch (err) {
                        console.error("Error creating offer:", err);
                    }
                });

                socketRef.current.on('offer', async (payload) => {
                    console.log("Received Offer (Unexpected as Instructor, but handling)");
                    const pc = createPeerConnection();
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                        await flushCandidateQueue();
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        socketRef.current.emit('answer', { roomId, sdp: answer });
                    } catch (err) {
                        console.error("Error handling offer:", err);
                    }
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

                socketRef.current.on('ice-candidate', (payload) => {
                    if (payload.candidate) {
                        const pc = peerConnectionRef.current;
                        if (!pc || !pc.remoteDescription) {
                            addCandidateToQueue(payload.candidate);
                        } else {
                            pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
                                .catch(e => console.error("Error adding ice candidate", e));
                        }
                    }
                });

                socketRef.current.on('receive-message', (data) => {
                    setMessages(prev => [...prev, data]);

                    // Add floating message bubble if it's from the other user
                    if (data.sender !== (user?.name || 'Instructor')) {
                        const id = Date.now();
                        setFloatingMessages(prev => [...prev, { id, message: data.message, sender: data.sender }]);
                        setTimeout(() => {
                            setFloatingMessages(prev => prev.filter(m => m.id !== id));
                        }, 5000);
                    }
                });

                socketRef.current.on('receive-reaction', (payload) => {
                    // Don't show our own echo if we implemented sending (though instructor doesn't send yet)
                    const id = Date.now() + Math.random();
                    const left = 10 + Math.random() * 80;

                    setFloatingReactions(prev => [...prev, { id, emoji: payload.emoji, left }]);

                    setTimeout(() => {
                        setFloatingReactions(prev => prev.filter(r => r.id !== id));
                    }, 2000);
                });

            } catch (err) {
                console.error("Error accessing media devices:", err);
                setMediaError("Could not access camera/microphone");
            }
        };

        startMediaAndSocket();

        return () => {
            isMounted = false;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
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

    // Re-attach stream to video element when it mounts
    useEffect(() => {
        if (!isVideoOff && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isVideoOff]);

    useEffect(() => {
        console.log("[InstructorLiveSession] Remote stream updated:", remoteStream ? `Stream ID: ${remoteStream.id}, Tracks: ${remoteStream.getTracks().length}` : "null");

        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(e => {
                console.error("[InstructorLiveSession] Error playing remote video:", e);
                setMediaError("Autoplay blocked: Click anywhere to enable video.");
            });
        }
    }, [remoteStream]);

    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleEndSession = () => {
        showAlert(
            'End session with student?',
            'confirm',
            async () => {
                try {
                    console.log("Ending session, Request ID:", sessionId);
                    if (sessionId) {
                        // Calculate final duration from timerState
                        let duration = timerState.accumulated;
                        if (timerState.lastResume) {
                            duration += (Date.now() - timerState.lastResume);
                        }
                        const durationInMins = duration / (1000 * 60);

                        console.log(`Ending session ${sessionId}. Duration: ${durationInMins.toFixed(2)} mins`);

                        const res = await updateSessionRequest(sessionId, {
                            status: 'completed',
                            duration: durationInMins.toFixed(1)
                        });
                        console.log("Session marked as completed:", res);
                    } else {
                        console.warn("No Session ID available to mark as completed. Room ID used:", roomId);
                        // Fallback: If roomId looks like a MongoID, try using it? 
                        // Usually roomId is 'demo-room' or the session ID.
                        if (roomId !== 'demo-room' && roomId !== 'test-room') {
                            await updateSessionRequest(roomId, { status: 'completed' });
                        }
                    }
                } catch (err) {
                    console.error("Failed to update session status:", err);
                    showAlert("Failed to update session status: " + (err.response?.data?.msg || err.message), "error");
                }

                if (socketRef.current) {
                    socketRef.current.emit('end-session', { roomId });
                }
                sessionStorage.removeItem('isLive');
                sessionStorage.removeItem('startTime');
                navigate('/instructor/feedback');
            }
        );
    };

    const sendMessage = () => {
        if (!inputText.trim()) return;
        const msgData = {
            roomId,
            message: inputText,
            sender: 'Instructor',
            time: new Date().toISOString()
        };
        if (socketRef.current) {
            socketRef.current.emit('send-message', msgData);
        }
        setInputText('');
    };

    const toggleVideo = async () => {
        if (isVideoOff) {
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = newStream.getVideoTracks()[0];
                if (streamRef.current) {
                    streamRef.current.addTrack(newVideoTrack);
                } else {
                    streamRef.current = newStream;
                }
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
            if (streamRef.current) {
                const videoTracks = streamRef.current.getVideoTracks();
                videoTracks.forEach(track => {
                    track.enabled = false;
                    track.stop();
                    streamRef.current.removeTrack(track); // Clean from stream
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
                setIsVideoOff(true);
                sessionStorage.setItem('isVideoOff', 'true');
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

        // Request offer again (acts as restart)
        if (socketRef.current) {
            socketRef.current.emit('request-offer', {
                roomId,
                userId: socketRef.current.id,
                studentName: studentName || 'Student'
            });
        }
    };

    const [isScreenSharing, setIsScreenSharing] = useState(false);
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

    const handleScreenShare = async () => {
        if (isScreenSharing) {
            await stopScreenShare();
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];

                // Preserve audio from current stream
                const audioTrack = streamRef.current?.getAudioTracks()[0];
                const newStream = new MediaStream([screenTrack]);
                if (audioTrack) newStream.addTrack(audioTrack);

                // Stop only the old VIDEO track (camera) to turn off light if possible
                if (streamRef.current) {
                    streamRef.current.getVideoTracks().forEach(t => t.stop());
                }

                if (peerConnectionRef.current) {
                    const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(screenTrack);
                }

                if (videoRef.current) videoRef.current.srcObject = newStream;
                streamRef.current = newStream;
                setIsScreenSharing(true);
                setIsVideoOff(false);

                screenTrack.onended = () => stopScreenShare();

            } catch (err) {
                console.error("Error starting screen share:", err);
            }
        }
    };

    const stopScreenShare = async () => {
        try {
            // Stop screen share track explicitly if not already stopped
            if (streamRef.current) {
                streamRef.current.getVideoTracks().forEach(t => t.stop());
            }

            const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const videoTrack = cameraStream.getVideoTracks()[0];
            const audioTrack = cameraStream.getAudioTracks()[0]; // New audio track

            // If we had an old audio track from before screen share, it might still be active in the mix
            // but since we get a fresh one here, we replace it.

            if (audioTrack) audioTrack.enabled = !isMuted;

            if (peerConnectionRef.current) {
                const senders = peerConnectionRef.current.getSenders();
                const videoSender = senders.find(s => s.track?.kind === 'video');
                if (videoSender) videoSender.replaceTrack(videoTrack);

                const audioSender = senders.find(s => s.track?.kind === 'audio');
                if (audioSender) audioSender.replaceTrack(audioTrack);
            }

            streamRef.current = cameraStream;
            if (videoRef.current) videoRef.current.srcObject = cameraStream;

            setIsScreenSharing(false);
        } catch (err) {
            console.error("Error reverting to camera:", err);
            setMediaError("Could not restart camera");
        }
    };

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

    const handleGoLive = () => {
        const start = Date.now();
        setStartTime(start);
        setIsLive(true);
        sessionStorage.setItem('isLive', 'true');
        sessionStorage.setItem('startTime', start.toString());

        if (socketRef.current) {
            socketRef.current.emit('sync-time', { roomId, startTime: start });
        }
    };

    // Auto-start if coming from dashboard
    useEffect(() => {
        if (location.state?.autoStart && !isLive && socketRef.current) {
            handleGoLive();
        }
    }, [location.state, socketRef.current]);

    // Connection Status Debugging
    const [connectionStatus, setConnectionStatus] = useState('initializing');

    return (
        <div className="session-container" ref={containerRef}>
            <div className="video-area">
                <div className="main-video-feed">
                    <div className="video-overlay-info">
                        <div className="instructor-tag">
                            <span className="live-indicator">LIVE</span>
                            {studentName || 'Waiting for Student...'}
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
                            pointerEvents: isPenActive ? 'all' : 'none',
                            cursor: isPenActive ? 'crosshair' : 'default'
                        }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />

                    {/* Remote Video (Student) */}
                    <div className="video-placeholder student-view">
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
                                <div className="avatar-large" style={{ backgroundColor: 'var(--accent-purple)', color: 'white' }}>A</div>
                                <p className="waiting-text">Waiting for student...</p>
                            </div>
                        )}
                    </div>

                    {/* Self View (Instructor) */}
                    <div className={`self-view ${isVideoOff && !isScreenSharing ? 'camera-off' : ''}`}>
                        {mediaError ? (
                            <div className="media-error-msg">!</div>
                        ) : (isVideoOff && !isScreenSharing) ? (
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
                </div>

                {/* Video Controls */}
                <div className="session-controls-bar">
                    <Button
                        variant={isMuted ? 'danger' : 'secondary'}
                        className="control-btn"
                        onClick={toggleMute}
                    >
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </Button>

                    <Button
                        variant={isVideoOff && !isScreenSharing ? 'danger' : 'secondary'}
                        className="control-btn"
                        onClick={toggleVideo}
                    >
                        {(isVideoOff && !isScreenSharing) ? <VideoOff size={20} /> : <Video size={20} />}
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
                        title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
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

                    <div className="pen-controls" style={{ display: 'flex', gap: '8px' }}>
                        <Button
                            variant={isPenActive ? 'active' : 'secondary'}
                            className={`control-btn ${isPenActive ? 'active-pen' : ''}`}
                            title="Whiteboard"
                            onClick={() => setIsPenActive(!isPenActive)}
                        >
                            <PenTool size={20} color={isPenActive ? '#22d3ee' : 'currentColor'} />
                        </Button>
                        {isPenActive && (
                            <Button variant="danger" className="control-btn" onClick={clearCanvas} title="Clear">
                                <X size={20} />
                            </Button>
                        )}
                    </div>

                    <Button variant="danger" className="control-btn end-call-btn" onClick={handleEndSession}>
                        <PhoneOff size={20} />
                        <span>End Session</span>
                    </Button>
                </div>
            </div>

            {/* Side Panel */}
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
                            ) : !sessionId ? (
                                <div className="doubt-details-section">
                                    <Badge variant="neutral" className="mb-2">General</Badge>
                                    <h3 className="doubt-title-Sidebar">General Session</h3>
                                    <p className="doubt-desc-sidebar">No specific doubt context provided.</p>
                                </div>
                            ) : (
                                <p className="loading-text">Loading session context...</p>
                            )}
                        </div>
                    ) : (
                        <div className="chat-section">
                            <div className="chat-messages">
                                <div className="chat-msg system">Session started</div>
                                {messages.map((msg, index) => (
                                    <div key={index} className={`chat-msg ${msg.sender === 'Instructor' ? 'sent' : 'received'}`}>
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

export default InstructorLiveSession;
