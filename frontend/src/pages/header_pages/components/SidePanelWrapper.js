import ReactDOM from "react-dom";
import MediaSidePanel from "../../sidebar_pages/components/MediaSidePanel";

const SidePanelWrapper = ({ item, type, onClose, lyrics, isLoadingLyrics }) => {
  if (!item) return null;

  return ReactDOM.createPortal(
    <MediaSidePanel item={item} type={type} onClose={onClose} lyrics={lyrics} isLoadingLyrics={isLoadingLyrics} />,
    document.body
  );
};

export default SidePanelWrapper;
