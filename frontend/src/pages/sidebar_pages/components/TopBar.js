import SearchBar from "./SearchBar";
import ViewToggle from "./ViewToggle";

const TopBar = ({ searchTerm, setSearchTerm, viewMode, changeViewMode, placeholder = "Search..." }) => (
  <div className="top-bar">
    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder={placeholder} />
    <ViewToggle viewMode={viewMode} changeViewMode={changeViewMode} />
  </div>
);

export default TopBar;
