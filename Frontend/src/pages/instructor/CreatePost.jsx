import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, Link as LinkIcon, FileText, X, ChevronLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import './CreatePost.css';

const InstructorCreatePost = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Attachment State
    const [selectedFile, setSelectedFile] = useState(null);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    const photoInputRef = useRef(null);
    const fileInputRef = useRef(null);

    const handlePhotoClick = () => {
        photoInputRef.current?.click();
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleLinkClick = () => {
        setShowLinkInput(!showLinkInput);
        setSelectedFile(null); // Clear file if link is selected
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile({ file, type });
            setShowLinkInput(false); // Clear link if file is selected
        }
    };

    const removeAttachment = () => {
        setSelectedFile(null);
        setShowLinkInput(false);
        setLinkUrl('');
        if (photoInputRef.current) photoInputRef.current.value = '';
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            navigate('/instructor'); // Back to dashboard
        }, 1500);
    };

    return (
        <div className="create-post-container">
            <div className="create-header">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="back-btn" style={{ marginBottom: '1rem' }}>
                    <ChevronLeft size={20} style={{ marginRight: '0.5rem' }} />
                    Back
                </Button>
                <h1 className="page-title">Share Knowledge</h1>
                <p className="page-subtitle">Post articles, tips, or resources for students</p>
            </div>

            <div className="create-layout">
                <div className="entry-form-section">
                    <Card className="form-card">
                        <form onSubmit={handleSubmit} className="post-form">
                            <Input
                                label="Post Title"
                                placeholder="e.g., Understanding React Hooks Deeply"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />

                            <Input
                                label="Content / Description"
                                placeholder="Share your insights here..."
                                as="textarea"
                                rows={8}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                            />

                            <Input
                                label="Tags (comma separated)"
                                placeholder="React, Tips, Performance"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                            />

                            <div className="attachment-options">
                                <input
                                    type="file"
                                    ref={photoInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'photo')}
                                    style={{ display: 'none' }}
                                />
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, 'file')}
                                    style={{ display: 'none' }}
                                />

                                <button type="button" className="attach-btn" onClick={handlePhotoClick}>
                                    <Image size={18} />
                                    <span>Photo</span>
                                </button>
                                <button type="button" className="attach-btn" onClick={handleLinkClick}>
                                    <LinkIcon size={18} />
                                    <span>Link</span>
                                </button>
                                <button type="button" className="attach-btn" onClick={handleFileClick}>
                                    <FileText size={18} />
                                    <span>File</span>
                                </button>
                            </div>

                            {/* Attachment Preview */}
                            {(selectedFile || showLinkInput) && (
                                <div className="attachment-preview" style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-cool-gray)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                                    {selectedFile && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {selectedFile.type === 'photo' ? <Image size={20} className="text-secondary" /> : <FileText size={20} className="text-secondary" />}
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{selectedFile.file.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({(selectedFile.file.size / 1024).toFixed(1)} KB)</span>
                                        </div>
                                    )}

                                    {showLinkInput && (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <LinkIcon size={20} className="text-secondary" />
                                            <input
                                                type="text"
                                                placeholder="Enter URL..."
                                                value={linkUrl}
                                                onChange={(e) => setLinkUrl(e.target.value)}
                                                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                                                autoFocus
                                            />
                                        </div>
                                    )}

                                    <button type="button" onClick={removeAttachment} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            <div className="form-actions">
                                <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Publishing...' : 'Publish Post'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>

                <div className="tips-sidebar">
                    <Card className="tips-card">
                        <h3 className="tips-title">Writing Tips</h3>
                        <ul className="tips-list">
                            <li>Keep titles concise and descriptive.</li>
                            <li>Use code blocks for technical examples.</li>
                            <li>Break down complex topics into bullet points.</li>
                            <li>Add tags to help students find your content.</li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default InstructorCreatePost;
