import React, { useState } from "react";
import ChapterSearch from "./SearchCh";

const Sidebar = () => {
  const [selectedClass, setSelectedClass] = useState<string>("");

  return (
    <div className="flex-col p-6 gap-3.5 shrink-0">
      <h1 className="font-bold">SELECT CLASS:</h1>
      <div className="flex gap-2">
        <button
          className={`border border-black p-1.5 rounded-full h-10 ${
            selectedClass === "11" ? "bg-red-600 text-white" : "bg-red-400"
          }`}
          onClick={() => setSelectedClass("11")}
        >
          CLASS 11
        </button>
        <button
          className={`border border-black p-1.5 rounded-full h-10 ${
            selectedClass === "12" ? "bg-purple-600 text-white" : "bg-purple-400"
          }`}
          onClick={() => setSelectedClass("12")}
        >
          CLASS 12
        </button>
      </div>
      <br />
      <h1 className="font-bold">SELECT CHAPTER:</h1>
      <div className="flex-col">
        <ChapterSearch selectedClass={selectedClass} />
      </div>
    </div>
  );
};

export default Sidebar;
