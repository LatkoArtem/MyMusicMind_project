import SearchIcon from "../../../icons/SearchIcon";

const SearchBar = ({ searchTerm, setSearchTerm, placeholder }) => (
  <div className="search-container">
    <SearchIcon />
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder={placeholder}
      className="search-input"
    />
  </div>
);

export default SearchBar;
