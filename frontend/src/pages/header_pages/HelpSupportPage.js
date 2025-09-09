import { useState } from "react";
import { useTranslation } from "react-i18next";
import "./styles/HelpSupportPage.css";

export default function HelpSupportPage() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: t("login_question"),
      answer: t("login_answer"),
    },
    {
      question: t("liked_songs_question"),
      answer: t("liked_songs_answer"),
    },
    {
      question: t("pages_question"),
      answer: t("pages_answer"),
    },
    {
      question: t("lyrics_question"),
      answer: t("lyrics_answer"),
    },
    {
      question: t("album_question"),
      answer: t("album_answer"),
    },
    {
      question: t("clustering_question"),
      answer: t("clustering_answer"),
    },
    {
      question: t("ratings_question"),
      answer: t("ratings_answer"),
    },
    {
      question: t("change_rating_question"),
      answer: t("change_rating_answer"),
    },
    {
      question: t("language_question"),
      answer: t("language_answer"),
    },
    {
      question: t("contact_question"),
      answer: t("contact_answer"),
    },
  ];

  const handleToggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="help-container">
      <h1 className="help-title">{t("titleHelpSupport", "Help & Support")}</h1>
      <p className="help-subtitle">{t("subtitle", "Тут ви знайдете відповіді на популярні питання")}</p>

      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div key={index} className={`faq-item ${activeIndex === index ? "active" : ""}`}>
            <button className="faq-question" onClick={() => handleToggle(index)}>
              {faq.question} <span className="arrow">{activeIndex === index ? "▲" : "▼"}</span>
            </button>
            {activeIndex === index && (
              <div className="faq-answer">
                {faq.answer.split("\n").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="help-contact">
        <p>{t("contact_prompt", "Не знайшли відповідь на своє питання?")}</p>
        <a href="mailto:support@mymusicmind-9gke.onrender.com" className="contact-btn">
          {t("contact_button", "Написати в підтримку")}
        </a>
      </div>
    </div>
  );
}
