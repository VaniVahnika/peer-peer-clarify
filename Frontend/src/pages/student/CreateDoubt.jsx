import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Code } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import './CreateDoubt.css';

const DOMAINS = ['React.js', 'Web Dev', 'Data Structures', 'CSS', 'Full Stack', 'Algorithms', 'Database'];

const CreateDoubt = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        domain: '',
        description: '',
        code: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate submission
        console.log('Submitting doubt:', formData);
        // Ideally, show success message then redirect
        navigate('/student/feed');
    };

    return (
        <div className="create-doubt-container">
            <Button variant="ghost" className="back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} />
                Back
            </Button>

            <div className="create-doubt-header">
                <h1 className="page-title">Post a New Doubt</h1>
                <p className="page-subtitle">Describe your problem clearly to get the best help</p>
            </div>

            <div className="create-doubt-content">
                <form onSubmit={handleSubmit} className="doubt-form">
                    <Card className="form-card">
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
                                rows={5}
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
                                    name="code"
                                    className="code-editor-input"
                                    placeholder="// Paste your code here..."
                                    spellCheck="false"
                                    value={formData.code}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                            <Button type="submit" variant="primary" size="lg">Post Publicly</Button>
                        </div>
                    </Card>
                </form>

                <div className="create-doubt-sidebar">
                    <Card className="tips-card">
                        <h3 className="card-heading">Tips for a good question</h3>
                        <ul className="tips-list">
                            <li>Be specific about what you want to achieve</li>
                            <li>Include the error message if there is one</li>
                            <li>Show the relevant code snippet</li>
                            <li>Check for similar questions first</li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CreateDoubt;
