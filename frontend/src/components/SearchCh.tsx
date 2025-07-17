import React, { useState, useEffect } from "react";

interface Props {
  selectedClass: string;
}

const class11Chapters: string[] = [
  "Sets",
  "Relations and Functions",
  "Trigonometric Functions",
  "Principle of Mathematical Induction",
  "Complex Numbers and Quadratic Equations",
  "Linear Inequalities",
  "Permutations and Combinations",
  "Binomial Theorem",
  "Sequences and Series",
  "Straight Lines",
  "Conic Sections",
  "Introduction to Three Dimensional Geometry",
  "Limits and Derivatives",
  "Mathematical Reasoning",
  "Statistics",
  "Probability"
];

const class12Chapters: string[] = [
  "Relations and Functions",
  "Inverse Trigonometric Functions",
  "Matrices",
  "Determinants",
  "Continuity and Differentiability",
  "Applications of Derivatives",
  "Integrals",
  "Applications of Integrals",
  "Differential Equations",
  "Vectors",
  "Three Dimensional Geometry",
  "Linear Programming",
  "Probability"
];

const ChapterSearch: React.FC<Props> = ({ selectedClass }) => {
  const [input, setInput] = useState<string>("");
  const [filtered, setFiltered] = useState<string[]>([]);

  const getChapters = (): string[] => {
    if (selectedClass === "11") return class11Chapters;
    if (selectedClass === "12") return class12Chapters;
    return [];
  };

  useEffect(() => {
    setInput("");      // Clear input on class change
    setFiltered([]);   // Clear dropdown
  }, [selectedClass]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    const chapters = getChapters();
    setFiltered(
      val
        ? chapters.filter((ch) =>
            ch.toLowerCase().includes(val.toLowerCase())
          )
        : []
    );
  };

  const handleSelect = (item: string) => {
    setInput(item);
    setFiltered([]);
  };

  if (!selectedClass) {
    return (
      <p className="text-gray-500 text-sm italic">Please select a class first.</p>
    );
  }

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
