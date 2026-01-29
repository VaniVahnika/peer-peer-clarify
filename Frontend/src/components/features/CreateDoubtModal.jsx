import { useState, useRef } from 'react';
import { Code, Image, Link as LinkIcon, FileText, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAlert } from '../../context/AlertContext';
import './CreateDoubtModal.css';
import { createDoubt } from '../../api/doubts';

const DOMAINS = [
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

const CreateDoubtModal = ({ isOpen, onClose }) => {
    const { showAlert } = useAlert();
    const [formData, setFormData] = useState({
        title: '',
        domain: '',
        description: '',
        codeSnippet: ''
    });

    const [selectedFiles, setSelectedFiles] = useState([]);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const handleRemoveFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Note: File upload logic handling would need FormData if backend expects multipart/form-data
            // For now sending JSON. Build FormData if backend requires it for files.
            // Assuming simplified JSON payload for first pass integration
            await createDoubt(formData);

            showAlert("Doubt posted successfully!", "success");

            // Reset form
            setFormData({
                title: '',
                domain: '',
                description: '',
                codeSnippet: ''
            });
            setSelectedFiles([]);
            onClose();
        } catch (err) {
            console.error("Failed to post doubt:", err);
            showAlert("Failed to post doubt. Please try again.", "error");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Post a New Doubt"
            className="create-doubt-modal"
        >
            <form onSubmit={handleSubmit} className="doubt-modal-form">
                <div className="modal-scroll-content">
                    <Input
                        label="Doubt Title"
                        name="title"
                        placeholder="e.g., How to implement authentication with JWT?"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />

                    <div className="input-group">
                        <label className="input-label">Domain / Topic</label>
                        <select
                            name="domain"
                            className="input-field select-field"
                            value={formData.domain}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a domain</option>
                            {DOMAINS.map(domain => (
                                <option key={domain} value={domain}>{domain}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Description</label>
                        <textarea
                            name="description"
                            className="input-field textarea-field"
                            placeholder="Explain what you are trying to do, what isn't working, and what you've tried..."
                            rows={4}
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="code-editor-section">
                        <label className="input-label">
                            <Code size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            Code Snippet (Optional)
                        </label>
                        <div className="code-editor-wrapper">
                            <textarea
                                name="codeSnippet"
                                className="code-editor-input"
                                placeholder="// Paste your code here..."
                                spellCheck="false"
                                value={formData.codeSnippet}
                                onChange={handleChange}
                                rows={6}
                            />
                        </div>
                    </div>

                    <div className="attachment-options-mini">
                        <span className="attach-label">Add:</span>

                        <input
                            type="file"
                            multiple
                            ref={imageInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'image')}
                        />
                        <button
                            type="button"
                            className="attach-btn-mini"
                            title="Image"
                            onClick={() => imageInputRef.current.click()}
                        >
                            <Image size={16} />
                        </button>

                        <button type="button" className="attach-btn-mini" title="Link">
                            <LinkIcon size={16} />
                        </button>

                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileChange(e, 'file')}
                        />
                        <button
                            type="button"
                            className="attach-btn-mini"
                            title="File"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <FileText size={16} />
                        </button>
                    </div>

                    {/* File Previews */}
                    {selectedFiles.length > 0 && (
                        <div className="file-previews">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="file-chip">
                                    <span className="file-name">{file.name}</span>
                                    <button
                                        type="button"
                                        className="remove-file-btn"
                                        onClick={() => handleRemoveFile(index)}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-footer-actions">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary">Post Publicly</Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateDoubtModal;
