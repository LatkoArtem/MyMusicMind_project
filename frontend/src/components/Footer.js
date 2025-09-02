import { useTranslation } from "react-i18next";
import "./styles/Footer.css";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <p className="footer-text">
        © {new Date().getFullYear()} MyMusicMind. {t("all_rights_reserved")}
      </p>
      <p className="footer-subtext">{t("discover_music_universe")}</p>
    </footer>
  );
}
