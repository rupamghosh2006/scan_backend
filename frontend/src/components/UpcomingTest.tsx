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

  useEffect(() => {
    const fetchUpcomingTests = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/v1/tests/11", {
          credentials: "include", // Include cookie if backend uses sessions
        });
        const data = await res.json();
        console.log("Fetched upcoming tests:", data);
        setTests(data); // Since response is an array
      } catch (error) {
        console.error("Failed to fetch upcoming tests:", error);
      }
    };

    fetchUpcomingTests();
  }, []);

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
