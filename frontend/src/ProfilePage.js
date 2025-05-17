import { useState, useEffect } from "react";
import "./ProfilePage.css";

const ProfilePage = ({ profile, onUpdate }) => {
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || "",
    email: profile?.email || "",
    avatar: profile?.avatar || null,
  });

  const [message, setMessage] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState(profile?.avatar || null);

  useEffect(() => {
    setFormData({
      display_name: profile?.display_name || "",
      email: profile?.email || "",
      avatar: profile?.avatar || null,
    });
    setPreviewAvatar(profile?.avatar || null);
    setMessage("");
  }, [profile]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result);
        setFormData((prev) => ({
          ...prev,
          avatar: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onUpdate(formData);
      setMessage("Profile updated successfully!");
    } catch (error) {
      setMessage("Failed to update profile");
    }
  };

  return (
    <div className="ProfileEditContainer">
      <h2>Edit Profile</h2>
      <form className="ProfileForm" onSubmit={handleSubmit}>
        <div className="AvatarUpload">
          <label htmlFor="avatar-input" className="AvatarWrapper">
            {previewAvatar ? (
              <img src={previewAvatar} alt="Avatar" className="AvatarPreview" />
            ) : (
              <div className="AvatarPlaceholder">No Avatar</div>
            )}
            <div className="AvatarOverlay">Change</div>
          </label>
          <input
            id="avatar-input"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: "none" }}
          />
        </div>

        <label>
          Display Name:
          <input type="text" name="display_name" value={formData.display_name} onChange={handleChange} required />
        </label>

        <label>
          Email:
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </label>

        <button type="submit">Save Changes</button>
        {message && <p className="SuccessMessage">{message}</p>}
      </form>
    </div>
  );
};

export default ProfilePage;
