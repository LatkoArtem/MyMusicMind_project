import { useState, useEffect } from "react";
import "./ProfilePage.css";

const ProfilePage = ({ profile, onUpdate }) => {
  const initialAvatar = profile?.avatar || profile?.images?.[0]?.url || null;

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || "",
    email: profile?.email || "",
    avatar: initialAvatar,
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    const updatedAvatar = profile?.avatar || profile?.images?.[0]?.url || null;

    setFormData({
      display_name: profile?.display_name || "",
      email: profile?.email || "",
      avatar: updatedAvatar,
    });

    setMessage("");
  }, [profile]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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
        <div className="AvatarDisplay">
          {formData.avatar ? (
            <img src={formData.avatar} alt="Avatar" className="AvatarPreview" />
          ) : (
            <div className="AvatarPlaceholder">No Avatar</div>
          )}
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
