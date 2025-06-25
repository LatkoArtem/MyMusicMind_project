import GridIcon from "../../../icons/GridIcon";
import HamburgerIcon from "../../../icons/HamburgerIcon";

const ViewToggle = ({ viewMode, changeViewMode }) => (
  <div className="view-toggle">
    <button onClick={() => changeViewMode("grid")} className={viewMode === "grid" ? "active" : ""}>
      <GridIcon />
    </button>
    <button onClick={() => changeViewMode("list")} className={viewMode === "list" ? "active" : ""}>
      <HamburgerIcon />
    </button>
  </div>
);

export default ViewToggle;
