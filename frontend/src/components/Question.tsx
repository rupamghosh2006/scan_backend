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
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<Partial<Question>>({});

  useEffect(() => {
    axios
      .get("http://localhost:4000/api/v1/scan/questions")
      .then((res) => {
        if (res.data.success) {
          setQuestions(res.data.data);
        }
      })
      .catch(console.error);
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete?")) return;
    try {
      await axios.delete(`http://localhost:4000/api/v1/scan/questions/${id}`);
      setQuestions((prev) => prev.filter((q) => q._id !== id));
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  const startEditing = (index: number) => {
    setEditIndex(index);
    setEditedQuestion({ ...questions[index] });
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setEditedQuestion({});
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await axios.put(`http://localhost:4000/api/v1/scan/questions/${id}`, editedQuestion);
      if (res.data.success) {
        const updated = [...questions];
        updated[editIndex!] = res.data.data;
        setQuestions(updated);
        cancelEdit();
      }
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleOptionChange = (value: string, optIndex: number) => {
    const newOptions = [...(editedQuestion.options || [])];
    newOptions[optIndex] = value;
    setEditedQuestion({ ...editedQuestion, options: newOptions });
  };

  return (
    <div className="p-9 space-y-6">
      {questions.map((q, index) => {
        const isEditing = editIndex === index;
        return (
          <div
            key={q._id}
            className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 flex flex-col gap-4"
          >
            {/* Action Buttons */}
<div className="flex justify-between items-center">
  {/* Chapter badge on the left */}
  <p className="border border-amber-500 bg-amber-200 rounded-xl px-2 py-0.5 text-sm font-medium">
    {q.chapter}
  </p>

  {/* Action buttons on the right */}
  <div className="flex gap-2">
    {isEditing ? (
      <>
        <button
          onClick={() => saveEdit(q._id)}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
        >
          Save
        </button>
        <button
          onClick={cancelEdit}
          className="px-3 py-1 text-sm bg-gray-400 text-white rounded hover:bg-gray-500"
        >
          Cancel
        </button>
      </>
    ) : (
      <>
        <button
          onClick={() => startEditing(index)}
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
      </>
    )}
  </div>
</div>


            {/* Question Text */}
            {isEditing ? (
              <input
                type="text"
                className="p-2 border border-gray-300 rounded-md"
                value={editedQuestion.question || ""}
                onChange={(e) =>
                  setEditedQuestion({ ...editedQuestion, question: e.target.value })
                }
              />
            ) : (
              <h1 className="text-lg font-semibold bg-blue-50 border border-blue-200 p-3 rounded-md w-full">
                {q.question}
              </h1>
            )}

            {/* Options */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4">
              {(isEditing ? editedQuestion.options : q.options).map((opt, idx) => (
                <li key={idx}>
                  {isEditing ? (
                    <input
                      type="text"
                      className={`p-2 rounded-md border w-full ${
                        opt === editedQuestion.correctAnswer
                          ? "bg-green-100 border-green-400"
                          : "border-gray-300"
                      }`}
                      value={opt}
                      onChange={(e) => handleOptionChange(e.target.value, idx)}
                    />
                  ) : (
                    <span
                      className={`block p-3 rounded-md shadow border text-sm ${
                        opt === q.correctAnswer
                          ? "bg-green-50 text-green-600 border-green-400 font-semibold"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {opt}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {/* Correct Answer Dropdown (only in edit mode) */}
            {isEditing && (
              <div className="px-4">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Correct Answer
                </label>
                <select
                  className="p-2 border border-gray-300 rounded-md w-full"
                  value={editedQuestion.correctAnswer}
                  onChange={(e) =>
                    setEditedQuestion({ ...editedQuestion, correctAnswer: e.target.value })
                  }
                >
                  {(editedQuestion.options || []).map((opt, idx) => (
                    <option key={idx} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default QuestionList;
