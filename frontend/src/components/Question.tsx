import React, { useEffect, useState } from "react";

import axios from "axios";

interface Question {
  _id: string;
  chapter: string;
  class: string;
  correctAnswer: string;
  options: string[];
  question: string;
  createdAt: string;
  updatedAt: string;
}

const QuestionList: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null); // ✅ Don't forget this


useEffect(() => {
  axios
    .get("http://localhost:4000/api/v1/scan/questions")
    .then((res) => {
      if (res.data.success) {
        setQuestions(res.data.data);
      } else {
        setError("Failed to load questions from server.");
      }
      setLoading(false);
    })
    .catch((err) => {
      setError("Failed to fetch questions.");
      console.error(err);
      setLoading(false);
    });
}, []);


  const handleEdit = (id: string) => {
    console.log("Edit question", id);
    // Implement your API call here
  };

  const handleDelete = (id: string) => {
    console.log("Delete question", id);
    // Implement your API call here
  };

  return (
    <div className="p-9 justify-center items-start sm:items-center gap-2">
      {questions.map((q) => (
        <div
          key={q._id}
          className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 flex flex-col gap-4"
        >
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleEdit(q._id)}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(q._id)}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
          <h1 className="text-lg font-semibold bg-blue-50 border border-blue-200 p-3 rounded-md w-full">{q.question}</h1>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4">
            {q.options.map((opt, idx) => (
              <li
                key={idx}
                className={`p-3 rounded-md shadow border text-sm ${
                  opt === q.correctAnswer 
                  ? "bg-green-50 text-green-600 border-green-400 font-semibold max-w-150" 
                  : "bg-white border-gray-300 max-w-150"
                }`}
              >
                {opt}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default QuestionList;