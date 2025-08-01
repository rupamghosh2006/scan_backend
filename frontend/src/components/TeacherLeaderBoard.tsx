import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import jsPDF from 'jspdf';

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
  score: number | null;
  participated: boolean;
  rank?: number;
  timeTakenSeconds?: number | null;
  timeTakenFormatted?: string | null;
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
const getRandomQuote = () => quotes[Math.floor(Math.random() * quotes.length)];

// Helper: parse test scheduled datetime
function getScheduledDateTime(test? : any) {
  return new Date(`${test.date}T${test.time}:00`);
}
// Helper: format duration (seconds) as mm:ss
function formatDuration(seconds: number | null) {
  if (seconds === null || seconds === undefined) return "-";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')} min`;
}

const TeachersDashboardLeaderboard: React.FC = () => {
  const [class11Students, setClass11Students] = useState<Student[]>([]);
  const [class12Students, setClass12Students] = useState<Student[]>([]);
  const [class11Leaderboard, setClass11Leaderboard] = useState<LeaderboardEntry[]>([]);
  const [class12Leaderboard, setClass12Leaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [quote11, setQuote11] = useState("");
  const [quote12, setQuote12] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [latestTest11, setLatestTest11] = useState<any | null>(null);
  const [latestTest12, setLatestTest12] = useState<any | null>(null);

  const getLatestTestForClass = useCallback(async (classNo: number) => {
    try {
      const response = await axios.get(`http://localhost:4000/api/v1/tests/${classNo}`);
      const tests: any[] = response.data;
      if (!tests || tests.length === 0) return null;
      // Choose test with latest date+time
      return tests.reduce((a, b) => {
        return new Date(`${a.date}T${a.time}`) > new Date(`${b.date}T${b.time}`) ? a : b;
      });
    } catch (err) {
      console.error(`Failed to fetch tests for class ${classNo}:`, err);
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        setLoading(true);

        // Fetch all verified students
        const studentRes = await axios.get("http://localhost:4000/api/v1/students/all");
        const allStudents: Student[] = studentRes.data.verified;
        const class11 = allStudents.filter((s) => s.class_No === 11);
        const class12 = allStudents.filter((s) => s.class_No === 12);

        setClass11Students(class11);
        setClass12Students(class12);

        // Fetch latest test configs for each class
        const [latestTest11, latestTest12] = await Promise.all([
          getLatestTestForClass(11),
          getLatestTestForClass(12),
        ]);

        // Fetch all questions once for scoring
        const questionsRes = await axios.get("http://localhost:4000/api/v1/scan/questions");
        const questions = questionsRes.data.data;

        // Helper to fetch and calculate scores
        const fetchScores = async (
          students: Student[],
          latestTest: any | null
        ): Promise<LeaderboardEntry[]> => {
          if (!latestTest) {
            return students.map((student) => ({
              mobile: student.mobile,
              name: student.fullName,
              score: null,
              participated: false,
              timeTakenSeconds: null,
              timeTakenFormatted: null,
            }));
          }
          const scheduledTime = getScheduledDateTime(latestTest);

          return await Promise.all(
            students.map(async (student) => {
              try {
                const res = await axios.get(
                  `http://localhost:4000/api/v1/testResponses?mobile=${student.mobile}`
                );
                const responses: any[] = res.data.data || [];
                const latestResponse = responses.find(
                  (resp) =>
                    resp.mobile === student.mobile &&
                    resp.testId === latestTest._id
                );
                if (!latestResponse) {
                  return {
                    mobile: student.mobile,
                    name: student.fullName,
                    score: null,
                    participated: false,
                    timeTakenSeconds: null,
                    timeTakenFormatted: null,
                  };
                }
                // Calculate correct/wrong
                let correct = 0, wrong = 0;
                for (const r of latestResponse.responses) {
                  const question = questions.find((q: any) => q._id === r.questionId);
                  if (!question) continue;
                  if (r.selectedOption === null) continue;
                  if (r.selectedOption === question.correctAnswer) correct++;
                  else wrong++;
                }
                const score = correct - wrong * 0.25;
                // Calculate time taken
                const submittedTime = new Date(latestResponse.createdAt);
                let timeTakenSeconds = Math.floor((submittedTime.getTime() - scheduledTime.getTime()) / 1000);
                if (timeTakenSeconds < 0) timeTakenSeconds = 0;
                return {
                  mobile: student.mobile,
                  name: student.fullName,
                  score,
                  participated: true,
                  timeTakenSeconds,
                  timeTakenFormatted: formatDuration(timeTakenSeconds),
                };
              } catch (err) {
                console.error(`Error fetching response for ${student.fullName}:`, err);
                return {
                  mobile: student.mobile,
                  name: student.fullName,
                  score: null,
                  participated: false,
                  timeTakenSeconds: null,
                  timeTakenFormatted: null,
                };
              }
            })
          );
        };

        // Fetch leaderboards for both classes
        const [lb11, lb12] = await Promise.all([
          fetchScores(class11, latestTest11),
          fetchScores(class12, latestTest12),
        ]);

        // Sort and tie-break by score then time ascending
        const rankEntries = (entries: LeaderboardEntry[]): LeaderboardEntry[] => {
          entries.sort((a, b) => {
            if ((a.score === null || a.score === undefined) && (b.score === null || b.score === undefined)) return 0;
            if (a.score === null || a.score === undefined) return 1;
            if (b.score === null || b.score === undefined) return -1;
            if (b.score !== a.score) return b.score - a.score;
            if ((a.timeTakenSeconds ?? Infinity) !== (b.timeTakenSeconds ?? Infinity))
              return (a.timeTakenSeconds ?? Infinity) - (b.timeTakenSeconds ?? Infinity);
            return 0;
          });
          let rank = 1;
          for (let i = 0; i < entries.length; i++) {
            if (entries[i].score !== null) {
              if (
                i > 0 &&
                (entries[i].score !== entries[i - 1].score ||
                 entries[i].timeTakenSeconds !== entries[i - 1].timeTakenSeconds)
              ) {
                rank = i + 1;
              }
              entries[i].rank = rank;
            }
          }
          return entries;
        };

        setLatestTest11(latestTest11);
        setLatestTest12(latestTest12);

        setClass11Leaderboard(rankEntries(lb11));
        setClass12Leaderboard(rankEntries(lb12));
        setQuote11(getRandomQuote());
        setQuote12(getRandomQuote());
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch leaderboard data:", error);
        setError("Failed to load leaderboard data. Please try again later.");
        setLoading(false);
      }
    };

    fetchData();
  }, [getLatestTestForClass]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        {error}
      </div>
    );
  }

  // PDF Export with time and tie-break info
  const exportLeaderboardAsPDF = (
    entries: LeaderboardEntry[],
    classNo: number,
    testDate?: string,
    chapters?: string[]
  ) => {
    const doc = new jsPDF();
    const randomQuote = getRandomQuote();
    let currentY = 20;

    // Header & Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(60, 60, 60);
    doc.text(`"${randomQuote}"`, 105, currentY, { align: 'center' });
    currentY += 10;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Class ${classNo} Leaderboard`, 105, currentY, { align: 'center' });
    currentY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    if (testDate) {
      doc.text(`Test Date: ${testDate}`, 105, currentY, { align: 'center' });
      currentY += 5;
    }
    if (chapters && chapters.length > 0) {
      const chaptersText = `Chapters: ${chapters.join(', ')}`;
      doc.text(chaptersText, 105, currentY, { align: 'center' });
      currentY += 5;
    }
    currentY += 10;

    // Table
    const startY = currentY;
    const rowHeight = 12;
    const colWidths = [20, 60, 35, 35]; // Rank, Name, Score, Time Taken
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const startX = (210 - tableWidth) / 2;

    const colPositions = [startX];
    for (let i = 1; i < colWidths.length; i++) {
      colPositions[i] = colPositions[i-1] + colWidths[i-1];
    }

    // Headers
    const headers = ["Rank", "Name", "Score", "Time Taken"];
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(52, 152, 219);
    doc.rect(startX, startY - 8, tableWidth, rowHeight, 'F');
    doc.setTextColor(255, 255, 255);
    headers.forEach((header, i) => {
      doc.text(header, colPositions[i] + colWidths[i]/2, startY - 1, { align: 'center' });
    });

    // Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    entries.forEach((entry, rowIndex) => {
      const y = startY + (rowIndex + 1) * rowHeight - 1;
      if (rowIndex % 2 === 1) {
        doc.setFillColor(248, 249, 250);
        doc.rect(startX, y - 8, tableWidth, rowHeight, 'F');
      }
      // Rank w/ color for top 2
      doc.setTextColor(0, 0, 0);
      if (entry.rank === 1) {
        doc.setFillColor(255, 215, 0); // Gold
        doc.roundedRect(colPositions[0] + 2, y - 7, 14, 10, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
      } else if (entry.rank === 2) {
        doc.setFillColor(185, 196, 199); // Silver
        doc.roundedRect(colPositions[0] + 2, y - 7, 14, 10, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
      } else if (entry.rank === 3) {
        doc.setFillColor(222, 107, 106); // Bronze
        doc.roundedRect(colPositions[0] + 2, y - 7, 14, 10, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      const rankText = entry.rank !== undefined ? entry.rank.toString() : "-";
      doc.text(rankText, colPositions[0] + colWidths[0]/2, y, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      // Name
      doc.text(entry.name || "N/A", colPositions[1] + 3, y, { align: 'left' });
      // Score
      doc.text(
        entry.score !== null && entry.score !== undefined
          ? entry.score.toFixed(2)
          : "-",
        colPositions[2] + colWidths[2]/2, y, { align: 'center' }
      );
      // Time Taken
      doc.text(entry.timeTakenFormatted ?? "-", colPositions[3] + colWidths[3]/2, y, { align: 'center' });
      // Mobile
      //doc.text(entry.mobile, colPositions[4] + 2, y, { align: 'left' });
    });

    // Footer
    const footerY = 280; // Near bottom
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    const generatedText = `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
    doc.text(generatedText, 105, footerY, { align: 'center' });

    // Save file
    const timestamp = new Date().toISOString().slice(0, 10);
    doc.save(`Class${classNo}_Leaderboard_${timestamp}.pdf`);
  };

  const renderLeaderboard = (
    entries: LeaderboardEntry[],
    classNo: number,
    quote: string,
    testDate?: string,
    chapters?: string[]
  ) => {
    const participatedCount = entries.filter((e) => e.participated).length;
    const totalCount = entries.length;

    return (
      <section className="w-full max-w-5xl mx-auto mb-8 bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 flex justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Class {classNo} Leaderboard</h2>
            <p className="italic text-blue-100 mb-3">"{quote}"</p>
            <div className="text-sm text-blue-100 mb-1">
              Participation: {participatedCount}/{totalCount} students
            </div>
            {testDate && (
              <div className="text-sm text-blue-200 mb-1">Test Date: {testDate}</div>
            )}
            {chapters && chapters.length > 0 && (
              <div className="text-sm text-blue-200 mb-1">
                Chapters: {chapters.join(", ")}
              </div>
            )}
          </div>
          <div>
            <button 
              onClick={() => exportLeaderboardAsPDF(
                entries, 
                classNo,
                testDate, 
                chapters
              )}
              className="align-middle border-2 border-amber-600 rounded-xl py-1 px-2 bg-amber-500 shadow-amber-800 shadow-md hover:bg-amber-600 hover:text-lg"
              aria-label={`Export Class ${classNo} leaderboard to PDF`}
            >
              🗎 Export to PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Rank</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Name</th>
                {/* <th className="py-3 px-4 text-left font-semibold text-gray-700">Mobile</th> */}
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Score</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Time Taken</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((entry, index) => (
                <tr
                  key={entry.mobile + index}
                  className={`hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                >
                  <td className="py-3 px-4">
                    {entry.rank !== undefined ? (
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          entry.rank === 1
                            ? "bg-yellow-100 text-yellow-800"
                            : entry.rank === 2
                            ? "bg-gray-100 text-gray-800"
                            : entry.rank === 3
                            ? "bg-orange-100 text-orange-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {entry.rank}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{entry.name}</td>
                  {/* <td className="py-3 px-4 text-gray-600">{entry.mobile}</td> */}
                  <td className="py-3 px-4">
                    {entry.score !== null ? (
                      <span className="font-semibold text-gray-900">{entry.score.toFixed(2)}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {entry.participated
                      ? (entry.timeTakenFormatted ?? "-")
                      : <span className="text-gray-400">-</span>
                    }
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        entry.participated ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {entry.participated ? "Participated" : "Not Participated"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {entries.length === 0 && (
          <div className="p-8 text-center text-gray-500">No students found for Class {classNo}</div>
        )}
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-cyan-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Leaderboard</h1>
          <p className="text-gray-600">Track student performance across classes</p>
        </div>
        {renderLeaderboard(
          class11Leaderboard, 
          11, 
          quote11, 
          latestTest11?.date, 
          latestTest11?.chapters
        )}
        {renderLeaderboard(
          class12Leaderboard, 
          12, 
          quote12, 
          latestTest12?.date, 
          latestTest12?.chapters
        )}
      </div>
    </div>
  );
};

export default TeachersDashboardLeaderboard;
