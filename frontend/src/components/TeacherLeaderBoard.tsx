import React, { useEffect, useState } from "react";
import axios from "axios";

interface Student {
  _id: string;
  fullName: string;
  mobile: string;
  class_No: 11 | 12;
  verified: boolean;
}

interface LeaderboardEntry {
  mobile: string;
  name: string;
  score: number | null; // null means no participation
  participated: boolean;
  rank?: number;
}

const quotes = [
  "Believe you can and you're halfway there.",
  "Don't watch the clock; do what it does. Keep going.",
  "Hard work beats talent when talent doesn't work hard.",
  "Success is not final, failure is not fatal: It is the courage to continue that counts.",
  "The only limit to our realization of tomorrow is our doubts of today.",
  "Education is the most powerful weapon which you can use to change the world.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Success is where preparation and opportunity meet.",
];

function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

const TeachersDashboardLeaderboard: React.FC = () => {
  const [class11Students, setClass11Students] = useState<Student[]>([]);
  const [class12Students, setClass12Students] = useState<Student[]>([]);
  const [class11Leaderboard, setClass11Leaderboard] = useState<LeaderboardEntry[]>([]);
  const [class12Leaderboard, setClass12Leaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [quote11, setQuote11] = useState("");
  const [quote12, setQuote12] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch all students
        const response = await axios.get('http://localhost:4000/api/v1/students/all');
        const allStudents = response.data.verified; // Only use verified students
        
        // Separate by class
        const class11 = allStudents.filter((s: Student) => s.class_No === 11);
        const class12 = allStudents.filter((s: Student) => s.class_No === 12);
        
        setClass11Students(class11);
        setClass12Students(class12);

        // 2. For each student fetch test score or mark not participated
        const fetchScores = async (students: Student[]): Promise<LeaderboardEntry[]> => {
          // Fetch questions once to avoid repeated API calls
          const questionsRes = await axios.get('http://localhost:4000/api/v1/scan/questions');
          const questions = questionsRes.data.data;

          const entries: LeaderboardEntry[] = await Promise.all(
            students.map(async (student) => {
              try {
                const res = await axios.get(`http://localhost:4000/api/v1/testResponses?mobile=${student.mobile}`);
                const responses = res.data.data || [];

                if (responses.length === 0) {
                  return { 
                    mobile: student.mobile, 
                    name: student.fullName, 
                    score: null, 
                    participated: false 
                  };
                }

                // ✅ Find the test response that matches this student's mobile
                const latestTest = responses.find((item: any) => item.mobile === student.mobile);
                
                if (!latestTest) {
                  return { 
                    mobile: student.mobile, 
                    name: student.fullName, 
                    score: null, 
                    participated: false 
                  };
                }

                // Calculate score per your scoring -> sum +1/-0.25/0 logic
                let correct = 0, wrong = 0, unattempted = 0;

                for (const r of latestTest.responses) {
                  const q = questions.find((q: any) => q._id === r.questionId);
                  if (!q) continue;
                  
                  if (r.selectedOption === null) {
                    unattempted++;
                  } else if (r.selectedOption === q.correctAnswer) {
                    correct++;
                  } else {
                    wrong++;
                  }
                }
                
                const score = correct * 1 - wrong * 0.25;

                return { 
                  mobile: student.mobile, 
                  name: student.fullName, 
                  score, 
                  participated: true 
                };
              } catch (error) {
                console.error(`Error fetching data for ${student.fullName}:`, error);
                return { 
                  mobile: student.mobile, 
                  name: student.fullName, 
                  score: null, 
                  participated: false 
                };
              }
            })
          );

          // Sort by score descending, null scores at bottom
          entries.sort((a, b) => {
            if (a.score === null && b.score === null) return 0;
            if (a.score === null) return 1;
            if (b.score === null) return -1;
            return b.score - a.score;
          });

          // Assign rank only to participated students
          let rank = 1;
          for (let i = 0; i < entries.length; i++) {
            if (entries[i].score !== null) {
              if (i > 0 && entries[i].score !== entries[i - 1].score) {
                rank = i + 1;
              }
              entries[i].rank = rank;
            }
          }

          return entries;
        };

        const [lb11, lb12] = await Promise.all([
          fetchScores(class11),
          fetchScores(class12)
        ]);

        setClass11Leaderboard(lb11);
        setClass12Leaderboard(lb12);
        setQuote11(getRandomQuote());
        setQuote12(getRandomQuote());

        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch leaderboard data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading leaderboard...</p>
      </div>
    );
  }

  const renderLeaderboard = (entries: LeaderboardEntry[], cls: number, quote: string) => {
    const participatedCount = entries.filter(e => e.participated).length;
    const totalCount = entries.length;

    return (
      <section className="w-full max-w-5xl mx-auto mb-8 bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <h2 className="text-2xl font-bold mb-2">Class {cls} Leaderboard</h2>
          <p className="italic text-blue-100 mb-3">"{quote}"</p>
          <div className="text-sm text-blue-100">
            Participation: {participatedCount}/{totalCount} students
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Rank</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Name</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Mobile</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Score</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((student, index) => (
                <tr 
                  key={student.mobile} 
                  className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                >
                  <td className="py-3 px-4">
                    {student.rank ? (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        student.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                        student.rank === 2 ? 'bg-gray-100 text-gray-800' :
                        student.rank === 3 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {student.rank}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{student.name}</td>
                  <td className="py-3 px-4 text-gray-600">{student.mobile}</td>
                  <td className="py-3 px-4">
                    {student.score !== null ? (
                      <span className="font-semibold text-gray-900">
                        {student.score.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        student.participated 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {student.participated ? "Participated" : "Not Participated"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {entries.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No students found for Class {cls}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Leaderboard</h1>
          <p className="text-gray-600">Track student performance across classes</p>
        </div>
        
        {renderLeaderboard(class11Leaderboard, 11, quote11)}
        {renderLeaderboard(class12Leaderboard, 12, quote12)}
      </div>
    </div>
  );
};

export default TeachersDashboardLeaderboard;
