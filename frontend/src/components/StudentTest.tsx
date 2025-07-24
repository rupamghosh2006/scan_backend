import React, { useEffect, useState } from "react";

interface Question {
  _id: string;
  chapter: string;
  class: number;
  options: string[];
  question: string;
  subject: string;
  visited?: boolean;
}

interface AnswerMap {
  [questionId: string]: string;
}

const StudentTest: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [testStarted, setTestStarted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/v1/scan/questions");
      const json = await res.json();
      if (json.success && json.data) {
        setQuestions(json.data);
        setTimeLeft(json.data.length * 5 * 60); // 5 minutes per question
      }
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    }
  };

  const startTest = () => {
    setQuestions((prev) =>
    prev.map((q, i) => (i === 0 ? { ...q, visited: true } : q))
  );
    setTestStarted(true);
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setIntervalId(id);
  };

  const showQuestion = (index: number) => {
    setCurrentIndex(index);
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index].visited = true;
      return updated;
    });
  };

  const handleAnswer = (qId: string, opt: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: opt }));
  };

  const clearAnswer = () => {
    const q = questions[currentIndex];
    const updated = { ...answers };
    delete updated[q._id];
    setAnswers(updated);
  };

  const submitTest = () => {
    if (intervalId) clearInterval(intervalId);
    const result = questions.map((q, i) => ({
      questionNumber: i + 1,
      questionId: q._id,
      selectedOption: answers[q._id] || null,
    }));
    console.log("Submitted:", JSON.stringify(result, null, 2));
    alert("Test submitted successfully!");
    window.location.href = "/students/results";
  };

  const timerDisplay = () => {
    const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const s = String(timeLeft % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      {!testStarted ? (
        <div className="bg-white p-6 rounded shadow text-center">
          <h2 className="text-xl font-semibold mb-4">Test Details</h2>
          <p className="mb-1">
            <strong>Subject:</strong> {questions[0]?.subject || "Math"}
          </p>
          <p className="mb-1">
            <strong>Total Questions:</strong> {questions.length}
          </p>
          <p className="mb-1">
            <strong>Total Time:</strong> {Math.ceil(questions.length * 5)} minutes
          </p>
          <button
            onClick={startTest}
            className="mt-4 bg-cyan-600 text-white px-6 py-2 rounded hover:bg-cyan-700"
          >
            Start Test
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <span className="bg-gray-800 text-white px-4 py-2 rounded text-lg font-mono">
              {timerDisplay()}
            </span>
            <button
              onClick={submitTest}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Submit Test
            </button>
          </div>

          <div className="bg-white p-6 rounded shadow space-y-4">
            <div className="font-medium text-lg">
             {questions[currentIndex].question}
            </div>
            <div className="space-y-2">
              {questions[currentIndex].options.map((opt, idx) => (
                <label key={idx} className="block">
                  <input
                    type="radio"
                    name={`q${currentIndex}`}
                    value={opt}
                    className="mr-2"
                    checked={answers[questions[currentIndex]._id] === opt}
                    onChange={() => handleAnswer(questions[currentIndex]._id, opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
            <div className="flex justify-between pt-4">
              <button
                onClick={() => currentIndex > 0 && showQuestion(currentIndex - 1)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Previous
              </button>
              <button
                onClick={() => currentIndex < questions.length - 1 && showQuestion(currentIndex + 1)}
                className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700"
              >
                Next
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={clearAnswer}
                className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600"
              >
                Clear Answer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 mt-6 p-4 bg-white shadow rounded text-sm">
            {questions.map((_, i) => {
              const q = questions[i];
              const isAnswered = answers[q._id];
              return (
                <button
                  key={q._id}
                  onClick={() => showQuestion(i)}
                  className={`w-8 h-8 rounded ${
                    isAnswered
                      ? "bg-green-500 text-white"
                      : q.visited
                      ? "bg-red-500 text-white"
                      : "border"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentTest;