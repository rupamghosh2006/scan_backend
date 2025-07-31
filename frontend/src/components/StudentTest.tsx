import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

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

interface Test {
  _id: string; // Added _id for testId
  date: string;
  time: string;
  chapters: string[];
  total_marks: number;
  subject: string;
  duration?: number; // Duration in minutes
}

const StudentTest: React.FC = () => {
  // === State ===
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [testStarted, setTestStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [startAllowed, setStartAllowed] = useState(false);
  const [subject, setSubject] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testEndTime, setTestEndTime] = useState<Date | null>(null);
  const [testData, setTestData] = useState<Test | null>(null);
  const [testId, setTestId] = useState<string | null>(null); // New: store testId

  // === Refs ===
  const answersRef = useRef<AnswerMap>(answers);

  // Extract student info (mobile & classNo) from localStorage
  let classNo: number | undefined = undefined;
  let studentMobile: string | undefined = undefined;
  if (typeof window !== "undefined") {
    const storedStudent = localStorage.getItem("student");
    if (storedStudent) {
      const student = JSON.parse(storedStudent);
      const studentClass = student.class_No || student.class || student.class_no;
      studentMobile = student.mobile || student.phone || student.mobile_number;
      classNo = studentClass;
    }
  }

  // Utility: Shuffle array elements in place
  const shuffleArray = (arr: any[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };

  // Calculate remaining time in seconds until the given end time
  const calculateTimeRemaining = (endTime: Date): number => {
    const now = new Date();
    return Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
  };

  // Load test configuration and questions from backend API
  const loadTestConfig = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/tests/${classNo}`);
      const [test] = await res.json();

      if (!test) {
        alert("No test scheduled for your class.");
        window.location.href = "/students";
        return;
      }

      setTestId(test._id); // Save test ID here!

      const { chapters, total_marks, subject, time, date, duration } = test;
      setSubject(subject || "Math");
      setTestData(test);

      const testDuration = duration || total_marks; // fallback duration
      const testStartTime = new Date(`${date}T${time}`);
      const calculatedEndTime = new Date(testStartTime.getTime() + testDuration * 60 * 1000);
      setTestEndTime(calculatedEndTime);

      const now = new Date();

      // Control start button availability
      if (now < testStartTime) {
        setStartAllowed(false);
        const delay = testStartTime.getTime() - now.getTime();
        setTimeout(() => setStartAllowed(true), delay);
      } else if (now >= calculatedEndTime) {
        setStartAllowed(false);
        setSubmitted(true);
        alert("Test time has ended. You cannot start the test now.");
        return;
      } else {
        setStartAllowed(true);
      }

      setTimeLeft(calculateTimeRemaining(calculatedEndTime));

      // Fetch all questions
      const qRes = await fetch("http://localhost:4000/api/v1/scan/questions");
      const qJson = await qRes.json();

      // Filter questions based on class and chapters
      const validQuestions: Question[] = qJson.data.filter(
        (q: Question) => q.class === classNo && chapters.includes(q.chapter)
      );

      // Allocate per chapter evenly
      const perChapter = Math.floor(total_marks / chapters.length);
      let selected: Question[] = [];

      chapters.forEach((chapter: string) => {
        const chapterQs = validQuestions.filter((q) => q.chapter === chapter);
        shuffleArray(chapterQs);
        selected.push(...chapterQs.slice(0, perChapter));
      });

      shuffleArray(selected);
      setQuestions(selected);
    } catch (err) {
      console.error("❌ Error loading test config:", err);
    }
  };

  // Start the test, initialize timers and flags
  const startTest = () => {
    if (testStarted || submitted || !testEndTime) return;

    setTestStarted(true);
    localStorage.setItem("test_started", "true");

    setQuestions((prev) => prev.map((q, i) => (i === 0 ? { ...q, visited: true } : q)));

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (!testEndTime) return prev;
        const newTime = calculateTimeRemaining(testEndTime);
        if (newTime <= 0) {
          clearInterval(id);
          submitTest(answersRef.current);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    setIntervalId(id);
  };

  // Submit test answers to backend
  const submitTest = async (submissionAnswers?: AnswerMap) => {
    if (submitted || isSubmitting) return;
    if (!testId) {
      alert("Test ID not found. Cannot submit test.");
      return;
    }

    setIsSubmitting(true);
    setSubmitted(true);

    if (intervalId) clearInterval(intervalId);

    const toSubmit = submissionAnswers || answersRef.current;

    const result = questions.map((q, i) => ({
      questionNumber: i + 1,
      questionId: q._id,
      selectedOption: toSubmit[q._id] || null,
    }));

    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(":").slice(0, 2).join(":");

    const submissionData = {
      mobile: studentMobile,
      date,
      time,
      testId, // include testId here
      responses: result,
    };

    try {
      const res = await axios.post("http://localhost:4000/api/v1/testResponses", submissionData);

      if (res.data.success) {
        localStorage.removeItem("test_started");
        localStorage.removeItem("test_answers");
        localStorage.setItem("test_id", testId);
        localStorage.setItem("test_submitted_time", now.toISOString());

        alert("✅ Test submitted successfully!");
      } else {
        throw new Error("Submission failed on server");
      }
    } catch (err) {
      console.error("❌ Submission error:", err);
      alert("❌ Something went wrong. Please try again.");

      setIsSubmitting(false);
      setSubmitted(false);

      if (testEndTime && calculateTimeRemaining(testEndTime) > 0) {
        startTest();
      }
    }
  };

  // Format countdown timer MM:SS
  const timerDisplay = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  // Show question at index and mark visited
  const showQuestion = (index: number) => {
    if (submitted) return;

    setCurrentIndex(index);
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index].visited = true;
      return updated;
    });
  };

  // Handle option selection
  const handleAnswer = (qId: string, opt: string) => {
    if (submitted) return;

    setAnswers((prev) => {
      const updated = { ...prev, [qId]: opt };
      localStorage.setItem("test_answers", JSON.stringify(updated));
      return updated;
    });
  };

  // Clear answer for current question
  const clearAnswer = () => {
    if (submitted) return;

    const q = questions[currentIndex];
    setAnswers((prev) => {
      const updated = { ...prev };
      delete updated[q._id];
      localStorage.setItem("test_answers", JSON.stringify(updated));
      return updated;
    });
  };

  // Auto-submit if page is closed or refreshed during active test
  const handleBeforeUnload = () => {
    if (testStarted && !submitted) {
      submitTest(answersRef.current);
    }
  };

  // Sync answersRef to latest answers state
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // On mount load test config, hydrate state, and handle unload event
  useEffect(() => {
    const savedAnswers = localStorage.getItem("test_answers");
    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers));
    }

    const alreadySubmitted = localStorage.getItem("test_id") !== null && localStorage.getItem("test_id") === testId;
    const wasTestStarted = localStorage.getItem("test_started") === "true";

    setSubmitted(alreadySubmitted);
    if (wasTestStarted && !alreadySubmitted) {
      setTestStarted(true);
    }

    loadTestConfig();

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Global check for test end time reached
  useEffect(() => {
    if (!testEndTime || submitted) return;

    const globalTimer = setInterval(() => {
      if (testStarted && !submitted) {
        const now = new Date();
        if (now >= testEndTime) {
          submitTest(answersRef.current);
        }
      }
    }, 1000);

    return () => clearInterval(globalTimer);
  }, [testEndTime, testStarted, submitted]);

  // Render component JSX
  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      {!testStarted ? (
        submitted ? (
          <div className="text-center text-green-600 text-xl font-semibold mt-10">
            ✅ You have already submitted the test.
          </div>
        ) : (
          <div className="bg-white p-6 rounded shadow text-center">
            <h2 className="text-xl font-semibold mb-4">Test Details</h2>
            <p className="mb-1">
              <strong>Subject:</strong> {subject}
            </p>
            <p className="mb-1">
              <strong>Total Questions:</strong> {questions.length}
            </p>
            <p className="mb-1">
              <strong>Time Remaining:</strong> {Math.ceil(timeLeft / 60)} minutes
            </p>
            {testEndTime && (
              <p className="mb-1 text-sm text-gray-600">
                <strong>Test Ends At:</strong> {testEndTime.toLocaleTimeString()}
              </p>
            )}
            <button
              onClick={startTest}
              disabled={!startAllowed || isSubmitting}
              className={`mt-4 px-6 py-2 rounded text-white ${
                startAllowed && !isSubmitting ? "bg-cyan-600 hover:bg-cyan-700" : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {!startAllowed ? "Wait for Start Time" : isSubmitting ? "Starting..." : "Start Test"}
            </button>
          </div>
        )
      ) : submitted ? (
        <div className="text-center text-green-600 text-xl font-semibold mt-10">
          ✅ Test has been submitted successfully!
          <p className="text-sm text-gray-600 mt-2">Thank you for taking the test. You may now close this window.</p>
        </div>
      ) : (
        <>
          {/* Timer and Submit Button */}
          <div className="flex justify-between items-center mb-4">
            <span className="bg-gray-800 text-white px-4 py-2 rounded text-lg font-mono">⏰ {timerDisplay()}</span>
            <button
              onClick={() => submitTest(answersRef.current)}
              disabled={isSubmitting}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit Test"}
            </button>
          </div>

          {/* Current Question */}
          <div className="bg-white p-6 rounded shadow space-y-4">
            <div className="font-medium text-lg">
              <span className="text-gray-600">Q{currentIndex + 1}.</span> {questions[currentIndex]?.question}
            </div>

            <div className="space-y-2">
              {questions[currentIndex]?.options.map((opt, idx) => (
                <label key={idx} className="block cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="radio"
                    name={`q${currentIndex}`}
                    value={opt}
                    className="mr-2"
                    checked={answers[questions[currentIndex]._id] === opt}
                    onChange={() => handleAnswer(questions[currentIndex]._id, opt)}
                    disabled={isSubmitting}
                  />
                  {opt}
                </label>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <button
                onClick={() => currentIndex > 0 && showQuestion(currentIndex - 1)}
                disabled={currentIndex === 0 || isSubmitting}
                className="bg-gray-300 px-4 py-2 rounded disabled:opacity-50"
              >
                ← Previous
              </button>
              <button
                onClick={() => currentIndex < questions.length - 1 && showQuestion(currentIndex + 1)}
                disabled={currentIndex === questions.length - 1 || isSubmitting}
                className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 disabled:opacity-50"
              >
                Next →
              </button>
            </div>

            {/* Clear answer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={clearAnswer}
                disabled={isSubmitting}
                className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                Clear Answer
              </button>
            </div>
          </div>

          {/* Question Grid Navigation */}
          <div className="grid grid-cols-5 gap-2 mt-6 p-4 bg-white shadow rounded text-sm">
            <div className="col-span-5 mb-2 text-xs text-gray-600">
              <span className="inline-block w-4 h-4 bg-green-500 rounded mr-1"></span>Answered
              <span className="inline-block w-4 h-4 bg-red-500 rounded mr-1 ml-3"></span>Visited
              <span className="inline-block w-4 h-4 border rounded mr-1 ml-3"></span>Not Visited
            </div>
            {questions.map((q, i) => {
              const isAnswered = answers[q._id];
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={q._id}
                  onClick={() => showQuestion(i)}
                  disabled={isSubmitting}
                  className={`w-8 h-8 rounded text-xs font-semibold border-2 ${
                    isCurrent
                      ? "border-blue-500 bg-blue-100"
                      : isAnswered
                      ? "bg-green-500 text-white border-green-500"
                      : q.visited
                      ? "bg-red-500 text-white border-red-500"
                      : "border-gray-300 hover:border-gray-400"
                  } ${isSubmitting ? "opacity-50" : ""}`}
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
