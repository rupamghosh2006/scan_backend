import React, { useState, useEffect, useMemo } from "react";
import { class11Chap, class12Chap } from "../middleware";

interface Props {
  selectedClass: string;
  onChapterSelect: (chapter: string) => void;
}

const ChapterSearch: React.FC<Props> = ({ selectedClass, onChapterSelect }) => {
  const class11 = useMemo(() => class11Chap(), []);
  const class12 = useMemo(() => class12Chap(), []);
  const chapters = useMemo(() => [...class11, ...class12], [class11, class12]);

  const getChapters = () => {
    if (selectedClass === "11") return class11;
    if (selectedClass === "12") return class12;
    return chapters;
  };

  const [input, setInput] = useState("");
  const [filtered, setFiltered] = useState<string[]>([]);

  useEffect(() => {
    setInput("");
    setFiltered([]);
    onChapterSelect("");
  }, [selectedClass, onChapterSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    const availableChapters = getChapters();
    setFiltered(
      val
        ? availableChapters.filter((ch) =>
            ch.toLowerCase().includes(val.toLowerCase())
          )
        : []
    );
    if (!val) onChapterSelect("");
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
        autoComplete="off"
      />
      {filtered.length > 0 && (
        <ul className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-b-lg shadow z-10 max-h-40 overflow-y-auto">
          {filtered.map((item) => (
            <li
              key={item}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(item)}
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSelect(item);
              }}
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
