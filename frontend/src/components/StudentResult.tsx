import React, { useEffect, useState } from "react";
import axios from "axios";

interface QA {
  question: string;
  options: string[];
  correctAnswer: string;
  selected: string | null;
}

interface Summary {
  total: number;
  correct: number;
  wrong: number;
  unattempted: number;
  score: number;
}

const StudentResult: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [qas, setQas] = useState<QA[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  
  // 🕒 New state for test end time validation
  const [testEndTime, setTestEndTime] = useState<Date | null>(null);
  const [isTestEnded, setIsTestEnded] = useState(false);
  const [timeUntilEnd, setTimeUntilEnd] = useState<string>("");

  // 1️⃣ Get mobile and class from localStorage
  let mobile = "";
  let classNo: number | undefined = undefined;
  
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("student");
    if (stored) {
      const student = JSON.parse(stored);
      mobile = student.mobile || "";
      classNo = student.class_No || student.class || student.class_no;
    }
  }

  /**
   * 🕐 Calculate and format time remaining until test ends
   * @param endTime - The test end time
   * @returns Formatted time string (e.g., "25m 30s")
   */
  const calculateTimeRemaining = (endTime: Date): string => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return "Test Ended";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m ${seconds}s remaining`;
  };

  /**
   * 📅 Fetch test configuration to determine the official test end time
   */
  const fetchTestEndTime = async () => {
    try {
      if (!classNo) return;
      
      const res = await fetch(`http://localhost:4000/api/v1/tests/${classNo}`);
      const [test] = await res.json();
      
      if (test && test.date && test.time && test.total_marks) {
        // Calculate official test end time
        const testStartTime = new Date(`${test.date}T${test.time}`);
        const endTime = new Date(testStartTime.getTime() + (test.total_marks * 60 * 1000));
        
        setTestEndTime(endTime);
        
        // Check if test has already ended
        const now = new Date();
        setIsTestEnded(now >= endTime);
      }
    } catch (error) {
      console.error("❌ Error fetching test end time:", error);
    }
  };

  /**
   * ⏰ Timer effect to continuously check if test has ended
   */
  useEffect(() => {
    if (!testEndTime) return;

    const timer = setInterval(() => {
      const now = new Date();
      const hasEnded = now >= testEndTime;
      
      setIsTestEnded(hasEnded);
      setTimeUntilEnd(calculateTimeRemaining(testEndTime));
      
      // Clear timer once test ends
      if (hasEnded) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [testEndTime]);

  /**
   * 📊 Fetch student results and question bank data
   */
  useEffect(() => {
    if (!mobile) return;

    const fetchData = async () => {
      try {
        // First, get test end time
        await fetchTestEndTime();
        
        const [respRes, bankRes] = await Promise.all([
          axios.get(
            `http://localhost:4000/api/v1/testResponses?mobile=${mobile}`
          ),
          axios.get("http://localhost:4000/api/v1/scan/questions"),
        ]);
        
        console.log("📋 Response data:", respRes.data.data, "Mobile:", mobile);
        
        // Check if student has submitted test
        const exists = respRes.data.data.some((item: any) => item.mobile === mobile);

        if (!exists) {
          console.log("❌ No submission found for this mobile!");
          setSummary(null);
          setLoading(false);
          return;
        }

        // Get latest submission
        const resp = respRes.data.data[0];
        const bank = bankRes.data.data;

        let correct = 0, wrong = 0, unattempted = 0;

        // Map responses with correct answers
        const merged: QA[] = resp.responses.map((r: any) => {
          const q = bank.find((x: any) => x._id === r.questionId);
          const isUnattempted = r.selectedOption === null;
          const isCorrect = r.selectedOption === q.correctAnswer;
          
          if (isUnattempted) unattempted++;
          else if (isCorrect) correct++;
          else wrong++;

          return {
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            selected: r.selectedOption,
          };
        });

        const total = resp.responses.length;
        const score = correct * 1 - wrong * 0.25; // +1 for correct, -0.25 for wrong

        setSummary({ total, correct, wrong, unattempted, score });
        setQas(merged);
        setLoading(false);
      } catch (err) {
        console.error("❌ Error fetching data:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [mobile]);

  /**
   * 🔍 Handle detailed analysis view toggle
   */
  const handleShowDetails = () => {
    if (isTestEnded) {
      setShowDetails(true);
    }
  };

  // Loading state
  if (loading) return <p className="p-10 text-center">Loading results…</p>;
  
  // No data found
  if (!summary) return <p className="p-10 text-center">No test submission found.</p>;

  // ──────────────────── RENDER COMPONENT ────────────────────
  return (
    <div className="p-6 flex flex-col items-center gap-6">
      {!showDetails ? (
        /* 📊 SUMMARY CARD */
        <div className="bg-white shadow-xl rounded-xl w-full max-w-md p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-center text-gray-800">
            Test Result
          </h2>

          {/* Score Statistics Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Total Questions" value={summary.total} />
            <Stat label="Correct" value={summary.correct} color="text-green-600" />
            <Stat label="Wrong" value={summary.wrong} color="text-red-600" />
            <Stat label="Unattempted" value={summary.unattempted} color="text-yellow-600" />
            
            {/* Final Score */}
            <div className="col-span-2 border-t pt-3 mt-2">
              <Stat 
                label="Final Score" 
                value={summary.score.toFixed(2)} 
                big 
                color="text-blue-600" 
              />
            </div>
          </div>

          {/* 🔒 Detailed Analysis Button with Time Restriction */}
          <div className="relative">
            <button
              onClick={handleShowDetails}
              disabled={!isTestEnded}
              className={`w-full text-center py-3 rounded-lg font-medium transition-all duration-200 ${
                isTestEnded
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              title={
                isTestEnded 
                  ? "View detailed analysis of your answers" 
                  : `Wait until test ends to view detailed analysis. ${timeUntilEnd}`
              }
            >
              {isTestEnded ? "📊 View Detailed Analysis" : "🔒 Detailed Analysis"}
            </button>
            
            {/* ⏰ Time remaining message */}
            {!isTestEnded && (
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-600">
                  ⏳ Test still in progress
                </p>
                <p className="text-xs text-orange-600 font-medium">
                  {timeUntilEnd}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Detailed analysis will be available after test ends
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 🔍 DETAILED ANALYSIS VIEW */
        <div className="w-full max-w-4xl space-y-6">
          {/* Back to Summary Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowDetails(false)}
              className="flex items-center text-blue-600 hover:text-blue-800 hover:underline text-sm transition-colors"
            >
              ← Back to Summary
            </button>
            <div className="text-sm text-gray-600">
              ✅ Test completed • Analysis available
            </div>
          </div>

          {/* Question Analysis Cards */}
          {qas.map((item, idx) => (
            <div
              key={idx}
              className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-shadow"
            >
              {/* Question Header */}
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                <span className="text-blue-600">Q{idx + 1}.</span> {item.question}
              </h3>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {item.options.map((opt, i) => {
                  const isCorrect = opt === item.correctAnswer;
                  const isSelected = opt === item.selected;

                  let optionClasses = "block p-3 rounded-lg border text-sm transition-all";
                  
                  if (isCorrect) {
                    optionClasses += " bg-green-50 text-green-800 border-green-300 font-medium";
                  } else if (isSelected && !isCorrect) {
                    optionClasses += " bg-red-50 text-red-700 border-red-300";
                  } else {
                    optionClasses += " bg-gray-50 border-gray-200 text-gray-700";
                  }

                  return (
                    <div key={i} className="relative">
                      <span className={optionClasses}>
                        {/* Option Icons */}
                        {isCorrect && <span className="text-green-600 mr-2">✓</span>}
                        {isSelected && !isCorrect && <span className="text-red-600 mr-2">✗</span>}
                        {opt}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Result Status */}
              <div className="flex justify-end">
                {item.selected === null && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    ⚪ Unattempted
                  </span>
                )}
                {item.selected && item.selected !== item.correctAnswer && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    ❌ Wrong (-0.25 marks)
                  </span>
                )}
                {item.selected && item.selected === item.correctAnswer && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    ✅ Correct (+1.00 marks)
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Summary Footer */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 text-center">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              📈 Final Performance
            </h4>
            <div className="flex justify-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.correct}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.wrong}</div>
                <div className="text-sm text-gray-600">Wrong</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.score.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Final Score</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResult;

/**
 * 📊 Reusable Stat Component for displaying statistics
 */
const Stat = ({
  label,
  value,
  big = false,
  color = "text-gray-800",
}: {
  label: string;
  value: string | number;
  big?: boolean;
  color?: string;
}) => (
  <div className="flex flex-col items-center gap-1">
    <span className={`font-bold ${big ? "text-3xl" : "text-xl"} ${color}`}>
      {value}
    </span>
    <span className="text-gray-600 text-sm">{label}</span>
  </div>
);
