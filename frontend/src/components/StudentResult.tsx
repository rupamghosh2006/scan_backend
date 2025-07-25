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

  // 1️⃣ grab mobile from localStorage
  let mobile = "";
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("student");
    if (stored) mobile = JSON.parse(stored).mobile || "";
  }

  // 2️⃣ fetch responses + bank once, then compute everything
  useEffect(() => {
    if (!mobile) return;

    const fetchData = async () => {
      try {
        const [respRes, bankRes] = await Promise.all([
          axios.get(
            `http://localhost:4000/api/v1/testResponses?mobile=${mobile}`
          ),
          axios.get("http://localhost:4000/api/v1/scan/questions"),
        ]);
        // console.log(respRes.data.data[0].mobile, mobile);
        console.log(respRes.data.data, mobile);
        
        const exists = respRes.data.data.some((item: any) => item.mobile === mobile);

          if (!exists) {
            console.log("❌ Mobile not found!");
            setSummary(null); // or a special flag like setNoData(true)
            setLoading(false);
            return;
          }

        // if (respRes.data.data.mobile !== mobile) {
        //     setSummary(null); // or a special flag like setNoData(true)
        //     setLoading(false);
        //     return;
        //     }
        const resp = respRes.data.data[0]; // latest attempt
        const bank = bankRes.data.data;

        let correct = 0,
          wrong = 0,
          unattempted = 0;

        const merged: QA[] = resp.responses.map((r: any) => {
          const q = bank.find((x: any) => x._id === r.questionId);
          const isUn = r.selectedOption === null;
          const isCor = r.selectedOption === q.correctAnswer;
          if (isUn) unattempted++;
          else if (isCor) correct++;
          else wrong++;

          return {
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            selected: r.selectedOption,
          };
        });

        const total = resp.responses.length;
        const score = correct * 1 - wrong * 0.25;

        setSummary({ total, correct, wrong, unattempted, score });
        setQas(merged);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchData();
  }, [mobile]);

  if (loading) return <p className="p-10 text-center">Loading…</p>;
  if (!summary) return <p className="p-10 text-center">No data found.</p>;

  // ──────────────────── MARKUP ────────────────────
  return (
    <div className="p-6 flex flex-col items-center gap-6">
      {!showDetails ? (
        /* SUMMARY CARD */
        <div className="bg-white shadow-xl rounded-xl w-full max-w-md p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-center">Test Result</h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Total Qs" value={summary.total} />
            <Stat label="Correct" value={summary.correct} />
            <Stat label="Wrong" value={summary.wrong} />
            <Stat label="Un-attempted" value={summary.unattempted} />
            <div className="col-span-2 border-t pt-3 mt-2">
              <Stat label="Score" value={summary.score.toFixed(2)} big />
            </div>
          </div>

          <button
            onClick={() => setShowDetails(true)}
            className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
          >
            Details Analysis
          </button>
        </div>
      ) : (
        /* DETAILED ANALYSIS */
        <div className="w-full max-w-3xl space-y-6">
          <button
            onClick={() => setShowDetails(false)}
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Summary
          </button>

          {qas.map((item, idx) => (
            <div
              key={idx}
              className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 flex flex-col gap-4"
            >
              <h1 className="text-lg font-semibold">
                {idx + 1}. {item.question}
              </h1>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.options.map((opt, i) => {
                  const isCorrect = opt === item.correctAnswer;
                  const chosen = opt === item.selected;

                  let classes =
                    "block p-3 rounded-md border text-sm transition";
                  if (isCorrect) {
                    classes +=
                      " bg-green-50 text-green-700 border-green-400";
                  } else if (chosen && !isCorrect) {
                    classes += " bg-red-50 text-red-600 border-red-400";
                  } else {
                    classes += " bg-white border-gray-300";
                  }

                  return (
                    <li key={i}>
                      <span className={classes}>{opt}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="text-right text-xs mt-1">
                {item.selected === null && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                    Un-attempted
                  </span>
                )}
                {item.selected &&
                  item.selected !== item.correctAnswer && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">
                      –0.25 marks
                    </span>
                  )}
                  {item.selected &&
                  item.selected === item.correctAnswer && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-500 rounded">
                      +1.00 marks
                    </span>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentResult;

/* Tiny stat helper */
const Stat = ({
  label,
  value,
  big,
}: {
  label: string;
  value: string | number;
  big?: boolean;
}) => (
  <div className="flex flex-col items-center gap-1">
    <span className={`font-bold ${big ? "text-2xl" : "text-lg"}`}>
      {value}
    </span>
    <span className="text-gray-600">{label}</span>
  </div>
);
