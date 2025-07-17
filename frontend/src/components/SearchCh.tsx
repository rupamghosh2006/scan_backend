import React, { useState, useEffect } from "react";
import { class11Chap, class12Chap } from "../middleware";

const class11: string[] = class11Chap();
const class12: string[] = class12Chap();
const chapters: string[] = [...class11, ...class12];

interface Props {
  selectedClass: string;
  onChapterSelect: (chapter: string) => void;
}

const ChapterSearch: React.FC<Props> = ({ selectedClass, onChapterSelect }) => {
  const [input, setInput] = useState<string>("");
  const [filtered, setFiltered] = useState<string[]>([]);
  const [prevClass, setPrevClass] = useState<string>("");

  const getChapters = (): string[] => {
    if (selectedClass === "11") return class11;
    if (selectedClass === "12") return class12;
    return chapters;
  };

  useEffect(() => {
    if (selectedClass !== prevClass) {
      setPrevClass(selectedClass);
      setInput("");
      setFiltered([]);
      onChapterSelect(""); // Reset selected chapter on class change
    }
  }, [selectedClass]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    const availableChapters = getChapters();
    const results = val
      ? availableChapters.filter((ch) =>
          ch.toLowerCase().includes(val.toLowerCase())
        )
      : [];
    setFiltered(results);
    if (!val) onChapterSelect(""); // Reset on empty input
  };

  const handleSelect = (item: string) => {
    setInput(item);
    setFiltered([]);
    onChapterSelect(item);
  };

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        placeholder="Search chapter"
        value={input}
        onChange={handleInputChange}
        className="w-full px-4 py-2 border border-cyan-600 rounded-full bg-white placeholder-gray-500"
      />
      {filtered.length > 0 && (
        <ul className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-b-lg shadow z-10 max-h-40 overflow-y-auto">
          {filtered.map((item) => (
            <li
              key={item}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(item)}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChapterSearch;
