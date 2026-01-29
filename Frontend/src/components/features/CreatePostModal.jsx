import { useState, useRef } from 'react';
import { Image, Link as LinkIcon, FileText, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAlert } from '../../context/AlertContext';
import './CreatePostModal.css';
import { createInstructorPost } from '../../api/instructors';

const CreatePostModal = ({ isOpen, onClose }) => {
    const { showAlert } = useAlert();
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tags: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Attachment State
    const [selectedFile, setSelectedFile] = useState(null);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    const photoInputRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoClick = () => photoInputRef.current?.click();
    const handleFileClick = () => fileInputRef.current?.click();

    const handleLinkClick = () => {
        setShowLinkInput(!showLinkInput);
        setSelectedFile(null);
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile({ file, type });
            setShowLinkInput(false);
        }
    };

    const removeAttachment = () => {
        setSelectedFile(null);
        setShowLinkInput(false);
        setLinkUrl('');
        if (photoInputRef.current) photoInputRef.current.value = '';
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Construct post data.
            // Note: If backend expects 'domain', we need to make sure it's in formData or added.
            // Looking at the form, it has 'tags' but no explicit 'domain' selector in this component.
            // Ideally instructor posts should key off their domain or have a selector.
            // For now sending what we have.
            const postData = {
                title: formData.title,
                content: formData.content,
                tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
                // attachment: selectedFile // Handle file upload logic if backend supports it
            };

            await createInstructorPost(postData);

            showAlert('Post published successfully!', 'success');
            // Reset form
            setFormData({ title: '', content: '', tags: '' });
            removeAttachment();
            onClose();

        } catch (err) {
            console.error("Failed to publish post:", err);
            showAlert("Failed to publish post. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Share Knowledge"
            className="create-post-modal"
        >
            <form onSubmit={handleSubmit} className="post-modal-form">
                <div className="modal-scroll-content">
                    <Input
                        label="Post Title"
                        name="title"
                        placeholder="e.g., Understanding React Hooks Deeply"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Content / Description"
                        name="content"
                        placeholder="Share your insights here..."
                        as="textarea"
                        rows={8}
                        className="textarea-field"
                        value={formData.content}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Tags (comma separated)"
                        name="tags"
                        placeholder="React, Tips, Performance"
                        value={formData.tags}
                        onChange={handleChange}
                    />

                    <div className="attachment-options-mini">
                        <span className="attach-label">Add Attachment:</span>

                        <input
                            type="file"
                            ref={photoInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'photo')}
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileChange(e, 'file')}
                        />

                        <button type="button" className="attach-btn-mini" onClick={handlePhotoClick} title="Add Photo">
                            <Image size={18} />
                        </button>
                        <button type="button" className="attach-btn-mini" onClick={handleLinkClick} title="Add Link">
                            <LinkIcon size={18} />
                        </button>
                        <button type="button" className="attach-btn-mini" onClick={handleFileClick} title="Add File">
                            <FileText size={18} />
                        </button>
                    </div>

                    {/* Attachment Preview */}
                    {(selectedFile || showLinkInput) && (
                        <div className="attachment-preview">
                            {selectedFile && (
                                <div className="preview-content">
                                    {selectedFile.type === 'photo' ? <Image size={20} className="text-secondary" /> : <FileText size={20} className="text-secondary" />}
                                    <div>
                                        <div className="preview-name">{selectedFile.file.name}</div>
                                        <div className="preview-size">({(selectedFile.file.size / 1024).toFixed(1)} KB)</div>
                                    </div>
                                </div>
                            )}

                            {showLinkInput && (
                                <div className="preview-content" style={{ flex: 1 }}>
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

                            <button type="button" className="remove-btn" onClick={removeAttachment}>
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    <div className="writing-tips-box">
                        <div className="tips-header">Writing Tips</div>
                        <ul className="tips-list-compact">
                            <li>Keep titles concise and descriptive.</li>
                            <li>Use code blocks for technical examples.</li>
                            <li>Break down complex topics into simple terms.</li>
                        </ul>
                    </div>
                </div>

                <div className="modal-footer-actions">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Publishing...' : 'Publish Post'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreatePostModal;
