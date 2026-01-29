import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, MessageSquare, Video, Code, Send, Plus, Zap } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import RequestSessionModal from '../../components/features/RequestSessionModal';
import CreateDoubtModal from '../../components/features/CreateDoubtModal';
import CreatePostModal from '../../components/features/CreatePostModal';
import { getDoubts } from '../../api/doubts';
import { useUser } from '../../context/UserContext';
import { useAlert } from '../../context/AlertContext';
import './Feed.css';

const CS_SUBJECTS = [
    'Data Structures & Algorithms',
    'Operating Systems',
    'Database Management Systems',
    'Computer Networks',
    'Software Engineering',
    'Digital Logic Design',
    'Theory of Computation',
    'Artificial Intelligence',
    'Compiler Design',
    'Full Stack Development'
];

const StudentFeed = ({ role = 'student' }) => {
    const navigate = useNavigate();
    const { user } = useUser();
    const { showAlert } = useAlert();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
    const [selectedDoubt, setSelectedDoubt] = useState(null);

    // Comment State
    const [activeCommentPostId, setActiveCommentPostId] = useState(null);
    const [commentText, setCommentText] = useState('');

    // Fetch Doubts on Mount
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const data = await getDoubts();
                setPosts(Array.isArray(data) ? data : (data.doubts || []));
            } catch (err) {
                console.error("Failed to fetch posts:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    const toggleCommentBox = (postId) => {
        if (activeCommentPostId === postId) {
            setActiveCommentPostId(null);
            setCommentText('');
        } else {
            setActiveCommentPostId(postId);
            setCommentText('');
        }
    };

    const handlePostComment = (postId) => {
        if (!commentText.trim()) return;
        // API call placeholder
        console.log(`Posting comment to post ${postId}: ${commentText}`);
        showAlert('Comment posted! (Mock logic for now)', 'success');
        setActiveCommentPostId(null);
        setCommentText('');
    };

    const handleRequestSession = (post) => {
        setSelectedDoubt(post);
        setIsSessionModalOpen(true);
    };

    const handleCreateClick = () => {
        if (role === 'instructor') {
            setIsCreatePostModalOpen(true);
        } else {
            setIsCreateModalOpen(true);
        }
    };

    const filteredPosts = posts.filter(post => {
        const matchesDomain = activeFilter === '' || post.domain === activeFilter;
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (post.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesDomain && matchesSearch;
    });

    return (
        <div className="feed-container">
            {/* Header & Controls */}
            <div className="feed-header">
                <div>
                    <h1 className="page-title">{role === 'instructor' ? 'Public Knowledge Feed' : 'Public Doubt Feed'}</h1>
                    <p className="page-subtitle">See what others are asking and learn together</p>
                </div>
                {loading && <span className="ml-4 text-sm text-secondary">Loading...</span>}
                <div className="feed-controls">
                    <div className="search-bar-wrapper">
                        <Search className="search-icon-input" size={18} />
                        <input
                            type="text"
                            placeholder="Search doubts..."
                            className="feed-search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="primary" onClick={handleCreateClick}>
                        {role === 'instructor' ? (
                            <>
                                <Zap size={18} style={{ marginRight: '0.5rem' }} />
                                Share Knowledge
                            </>
                        ) : (
                            <>
                                <Plus size={18} style={{ marginRight: '0.5rem' }} />
                                Post a Doubt
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Domain Filters */}
            <div className="domain-filters">
                <div className="domain-select-wrapper" style={{ maxWidth: '300px' }}>
                    <BookOpen size={18} className="select-icon" />
                    <select
                        className="input-field select-field with-icon"
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value)}
                    >
                        <option value="">All Subjects</option>
                        {CS_SUBJECTS.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Posts List */}
            <div className="posts-list">
                {filteredPosts.length > 0 ? (
                    filteredPosts.map(post => (
                        <Card key={post._id || post.id} className="post-card">
                            <div className="post-header">
                                <div className="post-meta-top">
                                    <div className="student-info">
                                        <div className="student-avatar">
                                            {(post.studentId?.name || 'User')[0]}
                                        </div>
                                        <span className="student-name">{post.studentId?.name || 'Anonymous User'}</span>
                                    </div>
                                    <span className="post-time">{new Date(post.createdAt).toLocaleDateString()}</span>
                                </div>
                                <Badge variant={post.domain === 'Full Stack Development' ? 'active' : 'default'} className="domain-badge">
                                    {post.domain}
                                </Badge>
                            </div>

                            <div className="post-content">
                                <h3 className="post-title">{post.title}</h3>
                                <p className="post-description">{post.description}</p>

                                {post.codeSnippet && (
                                    <div className="code-snippet-block">
                                        <div className="code-label">
                                            <Code size={14} />
                                            <span>Snippet</span>
                                        </div>
                                        <pre><code>{post.codeSnippet}</code></pre>
                                    </div>
                                )}
                            </div>

                            <div className="post-actions">
                                <div className="action-stats">
                                    <span className="stat-item">
                                        <MessageSquare size={18} />
                                        {post.comments?.length || 0} Comments
                                    </span>
                                </div>
                                <div className="action-buttons">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={activeCommentPostId === post._id ? 'active-comment-btn' : ''}
                                        onClick={() => toggleCommentBox(post._id)}
                                    >
                                        Comment
                                    </Button>

                                    {/* Allow requesting session only if the current user IS the author */}
                                    {user && (post.studentId?._id === user.id || post.studentId?._id === user._id) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="request-session-btn"
                                            onClick={() => handleRequestSession(post)}
                                        >
                                            <Video size={16} style={{ marginRight: '0.5rem' }} />
                                            Request Session
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Comment Editor Section */}
                            {activeCommentPostId === post._id && (
                                <div className="comment-editor-section">
                                    <div className="comment-input-wrapper">
                                        <textarea
                                            className="comment-textarea"
                                            placeholder="Write a helpful comment..."
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="comment-actions">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleCommentBox(post._id)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            disabled={!commentText.trim()}
                                            onClick={() => handlePostComment(post._id)}
                                        >
                                            <Send size={14} style={{ marginRight: '0.25rem' }} />
                                            Post Comment
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))
                ) : (
                    <div className="empty-state">
                        <p>No doubts found matching your criteria.</p>
                    </div>
                )}
            </div>

            <RequestSessionModal
                isOpen={isSessionModalOpen}
                onClose={() => setIsSessionModalOpen(false)}
                doubt={selectedDoubt}
            />

            <CreateDoubtModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            <CreatePostModal
                isOpen={isCreatePostModalOpen}
                onClose={() => setIsCreatePostModalOpen(false)}
            />
        </div>
    );
};

export default StudentFeed;
