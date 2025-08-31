import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./styles/MyMusicTrends.css";

const MyMusicTrends = () => {
  const { t } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8888/profile", {
          credentials: "include",
        });
        if (res.status === 200) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("Login check failed:", err);
        setIsLoggedIn(false);
      }
    };

    checkLogin();
  }, []);

  if (isLoggedIn === null) {
    return <div className="mytrends-page">{t("loading_ratings")}</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="mytrends-page">
        <div>{t("login_prompt")}</div>
      </div>
    );
  }

  return (
    <div className="mytrends-page">
      <p className="Homepage">MyMusicTrends</p>
    </div>
  );
};

export default MyMusicTrends;
