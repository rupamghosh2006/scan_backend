import React, { useEffect, useState } from "react";
import axios from "axios";

interface Student {
  _id: string;
  fullName: string;
  class_No: number;
  mobile: string;
}

const ManageStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchStudents = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/v1/students/register");
      console.log("API response:", res.data);
      if (res.data.success) {
        setStudents(res.data.data); // or res.data.students if you rename it
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchStudents();
}, []);




  if (loading) return <p className="text-center">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Registered Students</h1>

      {students.length === 0 ? (
        <p className="text-gray-500">No students registered yet.</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {students.map((student) => (
            <div
              key={student._id}
              className="border rounded-lg shadow p-4 bg-white"
            >
              <h2 className="text-lg font-semibold">{student.fullName}</h2>
              <p>Class: {student.class_No}</p>
              <p>Mobile: {student.mobile}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageStudents;
