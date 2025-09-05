import { useEffect, useState } from "react";
import axios from "axios";

const useViewMode = () => {
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    axios
      .get("https://mymusicmind.onrender.com/profile", { withCredentials: true })
      .then((res) => {
        const savedMode = res.data.viewMode;
        if (savedMode === "grid" || savedMode === "list") {
          setViewMode(savedMode);
        }
      })
      .catch((err) => console.warn("Failed to fetch viewMode:", err));
  }, []);

  const changeViewMode = (mode) => {
    setViewMode(mode);
    axios
      .post("https://mymusicmind.onrender.com/viewmode", { viewMode: mode }, { withCredentials: true })
      .catch((err) => console.warn("Could not save view mode", err));
  };

  return { viewMode, changeViewMode };
};

export default useViewMode;
