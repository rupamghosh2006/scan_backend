import React, { useState } from "react";
import ChapterSearch from "./SearchCh";
import QuestionList from "./Question";

const Sidebar = () => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");

  return (
    <div className="flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="flex-col p-6 gap-3.5 shrink-0">
        <h1 className="font-bold">SELECT CLASS:</h1>
        <div className="flex gap-2">
          <button
            className={`border border-black p-1.5 rounded-full h-10 ${
              selectedClass === "11" ? "bg-red-600 text-white" : "bg-red-400"
            }`}
            onClick={() => {
              setSelectedClass("11");
              setSelectedChapter(""); // reset chapter on class change
            }}
          >
            CLASS 11
          </button>
          <button
            className={`border border-black p-1.5 rounded-full h-10 ${
              selectedClass === "12" ? "bg-purple-600 text-white" : "bg-purple-400"
            }`}
            onClick={() => {
              setSelectedClass("12");
              setSelectedChapter("");
            }}
          >
            CLASS 12
          </button>
        </div>
        <br />
        <h1 className="font-bold">SELECT CHAPTER:</h1>
        <ChapterSearch
          selectedClass={selectedClass}
          onChapterSelect={setSelectedChapter}
        />
      </div>

      {/* Questions Area */}
      <div className="flex-1 p-6">
        <QuestionList
          selectedClass={selectedClass}
          selectedChapter={selectedChapter}
        />
      </div>
    </div>
  );
};

export default Sidebar;
