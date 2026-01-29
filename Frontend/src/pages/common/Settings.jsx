import { useRef, useState } from 'react';
import { Camera, Save, User } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useAlert } from '../../context/AlertContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import './Settings.css';

const Settings = () => {
    const { user, updateProfile } = useUser();
    const { showAlert } = useAlert();
    const [formData, setFormData] = useState({
        name: user.name,
        bio: user.bio,
        email: user.email
    });
    const [previewImage, setPreviewImage] = useState(user.avatar);
    const fileInputRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSaving(true);

        // Simulate API delay
        setTimeout(() => {
            updateProfile({
                ...formData,
                avatar: previewImage
            });
            setIsSaving(false);
            showAlert('Profile updated successfully!', 'success');
        }, 800);
    };

    return (
        <div className="settings-container">
            <h1 className="page-title">Account Settings</h1>

            <div className="settings-grid">
                <Card className="profile-card">
                    <div className="profile-header">
                        <div className="avatar-upload-wrapper">
                            <div className="avatar-large">
                                {previewImage ? (
                                    <img src={previewImage} alt="Profile" className="avatar-img" />
                                ) : (
                                    <div className="avatar-placeholder">
                                        <User size={48} />
                                    </div>
                                )}
                                <button
                                    className="upload-btn"
                                    onClick={() => fileInputRef.current.click()}
                                    type="button"
                                >
                                    <Camera size={16} />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />
                            </div>
                            <div className="profile-summ">
                                <h2 className="profile-name">{user.name}</h2>
                                <span className="profile-role">{user.role}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="settings-form-card">
                    <h3 className="section-title">Personal Information</h3>
                    <form onSubmit={handleSubmit} className="settings-form">
                        <Input
                            label="Full Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            label="Email Address"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled // Often email cannot be changed easily
                            helperText="Contact admin to change email"
                        />

                        <div className="input-group">
                            <label className="input-label">Bio</label>
                            <textarea
                                name="bio"
                                className="input-field textarea-field"
                                rows={3}
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Tell us a bit about yourself"
                            />
                        </div>

                        <div className="form-actions">
                            <Button type="submit" variant="primary" size="lg" disabled={isSaving}>
                                {isSaving ? 'Saving...' : (
                                    <>
                                        <Save size={18} style={{ marginRight: '0.5rem' }} />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
