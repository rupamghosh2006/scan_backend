import React, { useEffect, useState } from "react";

interface Test {
  _id: string;
  date: string;
  time: string;
  class_No: number;
  chapters: string[];
  total_marks: number;
}

const UpcomingTest = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUpcomingTests = async () => {
      try {
        const storedStudent = localStorage.getItem("student");
        if (!storedStudent) {
          setError("Student info not found in localStorage.");
          return;
        }

        const student = JSON.parse(storedStudent);
        const studentClass = student.class_No || student.class || student.class_no;

        if (!studentClass) {
          setError("Class number missing from student data.");
          return;
        }

        const res = await fetch(`http://localhost:4000/api/v1/tests/${studentClass}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch test data");

        const data = await res.json();
        setTests(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingTests();
  }, []);

  if (loading) return <p className="text-yellow-700">Loading upcoming tests...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="bg-yellow-100 border border-yellow-400 p-4 rounded-lg shadow-md mt-4">
      <h2 className="text-lg font-semibold mb-2 text-yellow-800">📢 Upcoming Test</h2>
      {tests.length > 0 ? (
        <ul className="list-disc pl-5">
          {tests.map((test) => (
            <li key={test._id}>
              <span className="font-medium">Date:</span> {test.date} |{" "}
              <span className="font-medium">Time:</span> {test.time} |{" "}
              <span className="font-medium">Chapters:</span>{" "}
              {test.chapters.join(", ")} |{" "}
              <span className="font-medium">Marks:</span> {test.total_marks}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-yellow-700">No upcoming tests found.</p>
      )}
    </div>
  );
};

export default UpcomingTest;
