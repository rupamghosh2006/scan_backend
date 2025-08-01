import React, { useState, useEffect } from 'react';

interface FormData {
  date: string;
  time: string;
  class_No: number;
  chapters: string[];
  total_marks: number;
}

interface Question {
  chapter: string;
  class: number;
}

interface TestFormProps {
  chapters: {
    class11: string[];
    class12: string[];
  };
}

const TestForm: React.FC<TestFormProps> = ({ chapters }) => {
  const [selectedClass, setSelectedClass] = useState<number>(11);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [highestMark, setHeighestMark] = useState<string>('')

  useEffect(() => {
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().split(':').slice(0, 2).join(':'));

    const fetchQuestionCounts = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/v1/scan/questions");
        const json = await res.json();
        
        if (json.success) {
          const counts: Record<string, number> = {};
          json.data.forEach((q: Question) => {
            const key = `${q.class}-${q.chapter}`;
            counts[key] = (counts[key] || 0) + 1;
          });
          setQuestionCounts(counts);
        }        

      } catch (error) {
        console.error("Failed to fetch questions:", error);
      }
    };

    fetchQuestionCounts();
  }, []);

  const handleClassChange = (classNo: number) => {
    setSelectedClass(classNo);
    setSelectedChapters([]);
  };

  const handleChapterToggle = (chapter: string) => {
    setSelectedChapters(prev =>
      prev.includes(chapter) ? prev.filter(c => c !== chapter) : [...prev, chapter]
    );
  };

  const handleSelectAll = () => {
    const currentChapters = selectedClass === 11 ? chapters.class11 : chapters.class12;
    setSelectedChapters(currentChapters);
  };

  const handleClearAll = () => setSelectedChapters([]);

  const generateOutput = (): FormData => ({
    date,
    time,
    class_No: selectedClass,
    chapters: selectedChapters,
    total_marks: totalMarks
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const output = generateOutput();

    try {
      const response = await fetch("http://localhost:4000/api/v1/tests", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
         },
        body: JSON.stringify(output),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      alert("Test configuration saved successfully!");
      console.log("Saved test config:", data.test);
      // Reset form state
      setSelectedChapters([]);
    } catch (err) {
      console.error("Failed to submit test config:", err);
      alert("Failed to submit test configuration. Check console.");
    }
  };

  useEffect(() => {
    setHeighestMark("100")
  },[selectedChapters])


  const currentChapters = selectedClass === 11 ? chapters.class11 : chapters.class12;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Select Class</h2>
              <div className="flex gap-4">
                {[11, 12].map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => handleClassChange(cls)}
                    className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
                      selectedClass === cls
                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Class {cls}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label htmlFor="totalMarks" className="block text-lg font-medium text-gray-700 mb-3">
                Total Marks
              </label>
              <input
                type="number"
                id="totalMarks"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))} //FIX THIS PART
                min="1"
                max={highestMark}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="Enter total marks"
              />
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Select Chapters (Class {selectedClass})
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentChapters.map((chapter) => {
                  const count = questionCounts[`${selectedClass}-${chapter}`] || 0;
                  return (
                    <label
                      key={chapter}
                      className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedChapters.includes(chapter)
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedChapters.includes(chapter)}
                          onChange={() => handleChapterToggle(chapter)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mr-3"
                        />
                        <span className="font-medium">{chapter}</span>
                      </div>
                      <span className="text-sm text-gray-500 ml-4">({count})</span>
                    </label>
                  );
                })}
              </div>

              {selectedChapters.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <p className="text-blue-800 font-medium">
                    Selected: {selectedChapters.length} chapter(s)
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                type="submit"
                disabled={selectedChapters.length === 0}
                className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
                  selectedChapters.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                Generate Test
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TestForm;
