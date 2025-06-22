import { useState, useEffect } from "react";
import "./styles/ProfilePage.css";

const ProfilePage = ({ profile }) => {
  const initialAvatar = profile?.avatar || profile?.images?.[0]?.url || null;

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || "",
    email: profile?.email || "",
    avatar: initialAvatar,
    bio: profile?.bio || "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    const updatedAvatar = profile?.avatar || profile?.images?.[0]?.url || null;

    setFormData({
      display_name: profile?.display_name || "",
      email: profile?.email || "",
      avatar: updatedAvatar,
      bio: profile?.bio || "",
    });

    setMessage("");
  }, [profile]);

  const handleBioChange = (e) => {
    const value = e.target.value;

    const paragraphs = value.split("\n");

    if (paragraphs.length > 4) {
      const trimmed = paragraphs.slice(0, 4).join("\n");
      setFormData((prev) => ({ ...prev, bio: trimmed }));
    } else {
      setFormData((prev) => ({ ...prev, bio: value }));
    }

    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const handleBioKeyDown = (e) => {
    const paragraphCount = formData.bio.split("\n").length;

    if (e.key === "Enter" && paragraphCount >= 4) {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("http://localhost:8888/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ bio: formData.bio }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      const result = await response.json();

      setMessage(result.message || "Profile updated successfully!");
    } catch (error) {
      setMessage("Error saving profile. Please try again.");
      console.error(error);
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
          <input type="text" name="display_name" value={formData.display_name} disabled />
        </label>

        <label>
          Email:
          <input type="email" name="email" value={formData.email} disabled />
        </label>

        <label className="BioText">
          Description:
          <textarea
            type="text"
            name="bio"
            value={formData.bio}
            onChange={handleBioChange}
            onKeyDown={handleBioKeyDown}
            placeholder="Tell us something about yourself..."
            rows={5}
            maxLength={250}
            style={{
              resize: "none",
              overflowY: "hidden",
              lineHeight: "20px",
              maxHeight: `${4 * 20 * 2}px`,
            }}
          />
          <div className="charCount">{formData.bio.length} / 250</div>
        </label>
        <button type="submit">Save Changes</button>
        {message && <p className="SuccessMessage">{message}</p>}
      </form>
    </div>
  );
};

export default ProfilePage;
