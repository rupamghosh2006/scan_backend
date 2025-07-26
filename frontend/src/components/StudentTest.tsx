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

const StudentTest: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [testStarted, setTestStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [startAllowed, setStartAllowed] = useState(false);
  const [subject, setSubject] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [testId, setTestId] = useState<string>("");

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

  const shuffleArray = (arr: any[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };

  const loadTestConfig = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/tests/${classNo}`);
      const [test] = await res.json();

      if (!test) {
        alert("No test scheduled for your class.");
        window.location.href = "/students";
        return;
      }

      setTestId(test._id);
      const alreadySubmitted = localStorage.getItem(`test_submitted_${test._id}`) === "true";
      setSubmitted(alreadySubmitted);

      const { chapters, total_marks, subject, time } = test;
      setSubject(subject || "Math");

      const now = new Date();
      const testStart = new Date(`${test.date}T${time}`);
      if (now >= testStart) {
        setStartAllowed(true);
      } else {
        const delay = testStart.getTime() - now.getTime();
        setTimeout(() => setStartAllowed(true), delay);
      }

      const qRes = await fetch("http://localhost:4000/api/v1/scan/questions");
      const qJson = await qRes.json();
      const validQuestions: Question[] = qJson.data.filter(
        (q: Question) =>
          q.class === classNo && chapters.includes(q.chapter)
      );

      const perChapter = Math.floor(total_marks / chapters.length);
      let selected: Question[] = [];

      chapters.forEach((chapter: string) => {
        const chapterQs = validQuestions.filter((q) => q.chapter === chapter);
        shuffleArray(chapterQs);
        selected.push(...chapterQs.slice(0, perChapter));
      });

      shuffleArray(selected);
      setQuestions(selected);
      setTimeLeft(total_marks * 60);
    } catch (err) {
      console.error("❌ Error loading test config:", err);
    }
  };

  const startTest = () => {
    setTestStarted(true);
    localStorage.setItem("test_started", "true");

    setQuestions((prev) =>
      prev.map((q, i) => (i === 0 ? { ...q, visited: true } : q))
    );

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

  const submitTest = async () => {
    if (submitted) return;
    setSubmitted(true);
    if (intervalId) clearInterval(intervalId);

    const result = questions.map((q, i) => ({
      questionNumber: i + 1,
      questionId: q._id,
      selectedOption: answers[q._id] || null,
    }));

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
        alert("✅ Test submitted successfully!");
        localStorage.removeItem("test_started");
        localStorage.setItem(`test_submitted_${testId}`, "true"); // ✅ unique ID based
        window.location.href = "/student/results";
      } else {
        alert("❌ Submission failed. Please try again.");
      }
    } catch (err) {
      console.error("❌ Submission error:", err);
      alert("❌ Something went wrong. Please try again.");
    }
  };

  const timerDisplay = () => {
    const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const s = String(timeLeft % 60).padStart(2, "0");
    return `${m}:${s}`;
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

  const handleBeforeUnload = () => {
    if (testStarted) {
      submitTest();
    }
  };

  useEffect(() => {
    loadTestConfig();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

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
              <strong>Total Time:</strong> {Math.ceil(timeLeft / 60)} minutes
            </p>
            <button
              onClick={startTest}
              disabled={!startAllowed}
              className={`mt-4 px-6 py-2 rounded text-white ${
                startAllowed
                  ? "bg-cyan-600 hover:bg-cyan-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {startAllowed ? "Start Test" : "Wait for Start Time"}
            </button>
          </div>
        )
      ) : submitted ? (
        <div className="text-center text-green-600 text-xl font-semibold mt-10">
          ✅ Test has been submitted successfully!
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <span className="bg-gray-800 text-white px-4 py-2 rounded text-lg font-mono">
              {timerDisplay()}
            </span>
            <button
              onClick={submitTest}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-60"
              disabled={submitted}
            >
              {submitted ? "Submitting..." : "Submit Test"}
            </button>
          </div>

          <div className="bg-white p-6 rounded shadow space-y-4">
            <div className="font-medium text-lg">
              {questions[currentIndex]?.question}
            </div>
            <div className="space-y-2">
              {questions[currentIndex]?.options.map((opt, idx) => (
                <label key={idx} className="block">
                  <input
                    type="radio"
                    name={`q${currentIndex}`}
                    value={opt}
                    className="mr-2"
                    checked={answers[questions[currentIndex]._id] === opt}
                    onChange={() =>
                      handleAnswer(questions[currentIndex]._id, opt)
                    }
                  />
                  {opt}
                </label>
              ))}
            </div>
            <div className="flex justify-between pt-4">
              <button
                onClick={() =>
                  currentIndex > 0 && showQuestion(currentIndex - 1)
                }
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  currentIndex < questions.length - 1 &&
                  showQuestion(currentIndex + 1)
                }
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
            {questions.map((q, i) => {
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
