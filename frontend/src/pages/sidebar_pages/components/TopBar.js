import SearchBar from "./SearchBar";
import ViewToggle from "./ViewToggle";
import { useTranslation } from "react-i18next";

const TopBar = ({ searchTerm, setSearchTerm, viewMode, changeViewMode }) => {
  const { t } = useTranslation();

  return (
    <div className="top-bar">
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder={t("searchPlaceholder")} />
      <ViewToggle viewMode={viewMode} changeViewMode={changeViewMode} />
    </div>
  );
};

export default TopBar;
