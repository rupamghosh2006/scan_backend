import React, { useEffect, useState } from "react";
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
  date: string;
  time: string;
  chapters: string[];
  total_marks: number;
  subject: string;
  duration?: number; // Duration in minutes
}

const StudentTest: React.FC = () => {
  // State variables for test management
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [testStarted, setTestStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // Time remaining in seconds
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [startAllowed, setStartAllowed] = useState(false);
  const [subject, setSubject] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent multiple submissions
  const [testEndTime, setTestEndTime] = useState<Date | null>(null); // Actual test end time
  const [testData, setTestData] = useState<Test | null>(null);

  // Extract student information from localStorage
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

  /**
   * Utility function to shuffle array elements randomly
   * Used for randomizing question order and options
   */
  const shuffleArray = (arr: any[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };

  /**
   * Calculate the remaining time until the test end time
   * This ensures students get only the remaining time, not the full duration
   */
  const calculateTimeRemaining = (endTime: Date): number => {
    const now = new Date();
    const remaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
    return remaining;
  };

  /**
   * Load test configuration and questions from the server
   * Sets up the test environment including time calculations
   */
  const loadTestConfig = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/tests/${classNo}`);
      const [test] = await res.json();

      if (!test) {
        alert("No test scheduled for your class.");
        window.location.href = "/students";
        return;
      }

      const { chapters, total_marks, subject, time, date, duration } = test;
      setSubject(subject || "Math");
      setTestData(test);

      // Calculate the actual test end time
      // Test ends at: test date + test time + duration (or total_marks minutes if no duration)
      const testDuration = duration || total_marks; // Duration in minutes
      const testStartTime = new Date(`${date}T${time}`);
      const calculatedEndTime = new Date(testStartTime.getTime() + (testDuration * 60 * 1000));
      setTestEndTime(calculatedEndTime);

      const now = new Date();
      
      // Check if current time is before test start time
      if (now < testStartTime) {
        setStartAllowed(false);
        // Set a timeout to allow starting when test time arrives
        const delay = testStartTime.getTime() - now.getTime();
        setTimeout(() => setStartAllowed(true), delay);
      } else if (now >= calculatedEndTime) {
        // Test has already ended - don't allow starting
        setStartAllowed(false);
        setSubmitted(true);
        alert("Test time has ended. You cannot start the test now.");
        return;
      } else {
        // Test is currently active - allow starting immediately
        setStartAllowed(true);
      }

      // Calculate remaining time until test ends (not from current time + duration)
      const remainingTime = calculateTimeRemaining(calculatedEndTime);
      setTimeLeft(remainingTime);

      // Load questions
      const qRes = await fetch("http://localhost:4000/api/v1/scan/questions");
      const qJson = await qRes.json();
      const validQuestions: Question[] = qJson.data.filter(
        (q: Question) => q.class === classNo && chapters.includes(q.chapter)
      );

      // Distribute questions evenly across chapters
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

  /**
   * Start the test and initialize the countdown timer
   * Prevents multiple starts and sets up auto-submission
   */
  const startTest = () => {
    // Prevent starting if already started or submitted
    if (testStarted || submitted || !testEndTime) return;

    setTestStarted(true);
    localStorage.setItem("test_started", "true");

    // Mark first question as visited
    setQuestions((prev) =>
      prev.map((q, i) => (i === 0 ? { ...q, visited: true } : q))
    );

    // Start countdown timer that updates every second
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = calculateTimeRemaining(testEndTime);
        
        // Auto-submit when time reaches zero or test end time is reached
        if (newTime <= 0) {
          clearInterval(id);
          submitTest();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    setIntervalId(id);
  };

  /**
   * Submit the test with proper validation and error handling
   * Prevents multiple submissions and handles network errors
   */
  const submitTest = async () => {
    // Prevent multiple submissions
    if (submitted || isSubmitting) return;
    
    setIsSubmitting(true);
    setSubmitted(true);
    
    // Clear the interval timer
    if (intervalId) clearInterval(intervalId);

    // Prepare test responses
    const result = questions.map((q, i) => ({
      questionNumber: i + 1,
      questionId: q._id,
      selectedOption: answers[q._id] || null,
    }));

    // Create submission timestamp
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(":").slice(0, 2).join(":");

    const submissionData = {
      mobile: studentMobile,
      date,
      time,
      responses: result,
    };

    try {
      const res = await axios.post(
        "http://localhost:4000/api/v1/testResponses",
        submissionData
      );

      if (res.data.success) {
        // Mark as permanently submitted to prevent retakes
        localStorage.removeItem("test_started");
        localStorage.setItem("test_submitted", "true");
        localStorage.setItem("test_submitted_time", now.toISOString());
        
        alert("✅ Test submitted successfully!");
        // Optionally redirect to results page
        // window.location.href = "/student/results";
      } else {
        throw new Error("Submission failed on server");
      }
    } catch (err) {
      console.error("❌ Submission error:", err);
      alert("❌ Something went wrong. Please try again.");
      
      // Reset submission states on error to allow retry
      setIsSubmitting(false);
      setSubmitted(false);
      
      // Restart timer if there's still time left
      if (testEndTime && calculateTimeRemaining(testEndTime) > 0) {
        startTest();
      }
    }
  };

  /**
   * Format time remaining into MM:SS format for display
   */
  const timerDisplay = (): string => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  /**
   * Navigate to a specific question and mark it as visited
   */
  const showQuestion = (index: number) => {
    if (submitted) return; // Prevent navigation after submission
    
    setCurrentIndex(index);
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index].visited = true;
      return updated;
    });
  };

  /**
   * Handle student's answer selection for current question
   */
  const handleAnswer = (qId: string, opt: string) => {
    if (submitted) return; // Prevent changes after submission
    setAnswers((prev) => ({ ...prev, [qId]: opt }));
  };

  /**
   * Clear the selected answer for current question
   */
  const clearAnswer = () => {
    if (submitted) return; // Prevent changes after submission
    
    const q = questions[currentIndex];
    const updated = { ...answers };
    delete updated[q._id];
    setAnswers(updated);
  };

  /**
   * Handle browser close/refresh - auto-submit to prevent data loss
   */
  const handleBeforeUnload = () => {
    if (testStarted && !submitted) {
      submitTest();
    }
  };

  /**
   * Initialize component and check for existing submissions
   */
  useEffect(() => {
    // Check if test was already submitted (prevent retakes)
    const alreadySubmitted = localStorage.getItem("test_submitted") === "true";
    const wasTestStarted = localStorage.getItem("test_started") === "true";
    
    setSubmitted(alreadySubmitted);
    
    // If test was started but not submitted, restore state
    if (wasTestStarted && !alreadySubmitted) {
      setTestStarted(true);
    }

    // Load test configuration and questions
    loadTestConfig();
    
    // Add event listener for browser close/refresh
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  /**
   * Auto-submit when test end time is reached (global enforcement)
   * This ensures all students are submitted at the same time regardless of when they started
   */
  useEffect(() => {
    if (!testEndTime || submitted) return;

    const checkEndTime = () => {
      const now = new Date();
      if (now >= testEndTime && testStarted && !submitted) {
        submitTest();
      }
    };

    // Check every second if test end time has been reached
    const globalTimer = setInterval(checkEndTime, 1000);
    
    return () => clearInterval(globalTimer);
  }, [testEndTime, testStarted, submitted]);

  // Render the test interface
  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      {!testStarted ? (
        // Pre-test state: Show test details and start button
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
                startAllowed && !isSubmitting
                  ? "bg-cyan-600 hover:bg-cyan-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {!startAllowed
                ? "Wait for Start Time"
                : isSubmitting
                ? "Starting..."
                : "Start Test"}
            </button>
          </div>
        )
      ) : submitted ? (
        // Post-submission state: Show confirmation message
        <div className="text-center text-green-600 text-xl font-semibold mt-10">
          ✅ Test has been submitted successfully!
          <p className="text-sm text-gray-600 mt-2">
            Thank you for taking the test. You may now close this window.
          </p>
        </div>
      ) : (
        // Active test state: Show questions and timer
        <>
          {/* Timer and Submit Button Header */}
          <div className="flex justify-between items-center mb-4">
            <span className="bg-gray-800 text-white px-4 py-2 rounded text-lg font-mono">
              ⏰ {timerDisplay()}
            </span>
            <button
              onClick={submitTest}
              disabled={isSubmitting}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit Test"}
            </button>
          </div>

          {/* Question Display Area */}
          <div className="bg-white p-6 rounded shadow space-y-4">
            <div className="font-medium text-lg">
              <span className="text-gray-600">Q{currentIndex + 1}.</span>{" "}
              {questions[currentIndex]?.question}
            </div>
            
            {/* Answer Options */}
            <div className="space-y-2">
              {questions[currentIndex]?.options.map((opt, idx) => (
                <label key={idx} className="block cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="radio"
                    name={`q${currentIndex}`}
                    value={opt}
                    className="mr-2"
                    checked={answers[questions[currentIndex]._id] === opt}
                    onChange={() =>
                      handleAnswer(questions[currentIndex]._id, opt)
                    }
                    disabled={isSubmitting}
                  />
                  {opt}
                </label>
              ))}
            </div>
            
            {/* Navigation Controls */}
            <div className="flex justify-between pt-4">
              <button
                onClick={() =>
                  currentIndex > 0 && showQuestion(currentIndex - 1)
                }
                disabled={currentIndex === 0 || isSubmitting}
                className="bg-gray-300 px-4 py-2 rounded disabled:opacity-50"
              >
                ← Previous
              </button>
              <button
                onClick={() =>
                  currentIndex < questions.length - 1 &&
                  showQuestion(currentIndex + 1)
                }
                disabled={currentIndex === questions.length - 1 || isSubmitting}
                className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
            
            {/* Clear Answer Button */}
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

          {/* Question Navigation Grid */}
          <div className="grid grid-cols-5 gap-2 mt-6 p-4 bg-white shadow rounded text-sm">
            <div className="col-span-5 mb-2 text-xs text-gray-600">
              <span className="inline-block w-4 h-4 bg-green-500 rounded mr-1"></span>
              Answered
              <span className="inline-block w-4 h-4 bg-red-500 rounded mr-1 ml-3"></span>
              Visited
              <span className="inline-block w-4 h-4 border rounded mr-1 ml-3"></span>
              Not Visited
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