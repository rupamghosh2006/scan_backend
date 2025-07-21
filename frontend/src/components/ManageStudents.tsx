import React, { useEffect, useState } from "react";
import axios from "axios";

interface Student {
  _id: string;
  fullName: string;
  mobile: string;
  class_No: string;
  guardianName: string;
  guardianMobile: string;
  verified: boolean;
}

const ManageStudents: React.FC = () => {
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [verifiedStudents, setVerifiedStudents] = useState<Student[]>([]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/v1/students/all", {
        withCredentials: true, // required if using cookies for auth
      });
      if (res.data.success) {
        setPendingStudents(res.data.unverified || []);
        setVerifiedStudents(res.data.verified || []);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  const handleAccept = async (id: string) => {
    const confAccept = window.confirm("Sure you want to accept this student?");
    if (!confAccept) return;

    try {
      await axios.patch(`http://localhost:4000/api/v1/students/accept/${id}`, {}, {
        withCredentials: true,
      });
      fetchStudents();
    } catch (err) {
      console.error("Error verifying student:", err);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:4000/api/v1/students/reject/${id}`, {
        withCredentials: true,
      });
      alert("Student deleted successfully.");
      fetchStudents();
    } catch (err) {
      console.error("Error deleting student:", err);
      alert("Failed to delete student.");
    }
  };


  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="p-6 space-y-12 max-w-4xl mx-auto">
      {/* Pending Students */}
      <div>
        <h2 className="text-3xl font-bold text-yellow-600 mb-4">Pending Approvals</h2>
        {pendingStudents.length === 0 ? (
          <p className="text-gray-500">No pending approvals.</p>
        ) : (
          <ul className="space-y-4">
            {pendingStudents.map((student) => (
              <li key={student._id} className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg shadow">
                <div className="font-semibold text-lg text-yellow-800">{student.fullName}</div>
                <div className="text-sm text-gray-700">Mobile: {student.mobile}</div>
                <div className="text-sm text-gray-700">Class: {student.class_No}</div>
                <div className="text-sm text-gray-700">
                  Guardian: {student.guardianName} ({student.guardianMobile})
                </div>
                <div className="flex gap-4 mt-3">
                  <button
                    onClick={() => handleAccept(student._id)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDelete(student._id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Verified Students */}
      <div>
        <h2 className="text-3xl font-bold text-green-600 mb-4">Verified Students</h2>
        {verifiedStudents.length === 0 ? (
          <p className="text-gray-500">No verified students.</p>
        ) : (
          <ul className="space-y-4">
            {verifiedStudents.map((student) => (
              <li key={student._id} className="bg-green-50 border border-green-300 p-4 rounded-lg shadow">
                <div className="font-semibold text-lg text-green-800">{student.fullName}</div>
                <div className="text-sm text-gray-700">Mobile: {student.mobile}</div>
                <div className="text-sm text-gray-700">Class: {student.class_No}</div>
                <div className="text-sm text-gray-700">
                  Guardian: {student.guardianName} ({student.guardianMobile})
                </div>
            {student.mobile !== "9876543210" && (
              <button
                onClick={() => handleDelete(student._id)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mt-3"
              >
                Delete
              </button>
            )}

              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ManageStudents;
