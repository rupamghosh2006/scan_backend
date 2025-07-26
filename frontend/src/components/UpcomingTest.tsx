import React, { useEffect, useState } from "react";

interface Test {
  _id: string;
  date: string;
  time: string;
  class_No: number;
  chapters: string[];
  total_marks: number;
  subject?: string; // Optional subject field
}

const UpcomingTest = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  /**
   * 🕐 Check if a test has expired based on its end time
   * @param test - Test object with date, time, and duration
   * @returns boolean - true if test has ended
   */
  const isTestExpired = (test: Test): boolean => {
    try {
      // Create test start time
      const testStartTime = new Date(`${test.date}T${test.time}`);
      // Calculate test end time (start time + duration in minutes)
      const testEndTime = new Date(testStartTime.getTime() + (test.total_marks * 60 * 1000));
      
      return currentTime >= testEndTime;
    } catch (error) {
      console.error("❌ Error parsing test time:", error);
      return false;
    }
  };

  /**
   * 🕐 Calculate time remaining until test starts or ends
   * @param test - Test object
   * @returns object with status and formatted time string
   */
  const getTestStatus = (test: Test) => {
    try {
      const testStartTime = new Date(`${test.date}T${test.time}`);
      const testEndTime = new Date(testStartTime.getTime() + (test.total_marks * 60 * 1000));
      
      const now = currentTime;
      
      // Test hasn't started yet
      if (now < testStartTime) {
        const diff = testStartTime.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          return { status: "upcoming", timeText: `Starts in ${days}d ${hours}h`, color: "blue" };
        } else if (hours > 0) {
          return { status: "upcoming", timeText: `Starts in ${hours}h ${minutes}m`, color: "blue" };
        } else {
          return { status: "upcoming", timeText: `Starts in ${minutes}m`, color: "orange" };
        }
      }
      
      // Test is currently active
      if (now >= testStartTime && now < testEndTime) {
        const diff = testEndTime.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return { 
          status: "active", 
          timeText: hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`, 
          color: "green" 
        };
      }
      
      // Test has ended
      return { status: "ended", timeText: "Test ended", color: "gray" };
    } catch (error) {
      return { status: "error", timeText: "Invalid date", color: "red" };
    }
  };

  /**
   * 📅 Format date to a more readable format
   * @param dateString - Date in YYYY-MM-DD format
   * @returns Formatted date string
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  /**
   * 🕐 Format time to 12-hour format with AM/PM
   * @param timeString - Time in HH:MM format
   * @returns Formatted time string
   */
  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  /**
   * 📚 Fetch upcoming tests from API
   */
  useEffect(() => {
    const fetchUpcomingTests = async () => {
      try {
        const storedStudent = localStorage.getItem("student");
        if (!storedStudent) {
          setError("Student information not found. Please log in again.");
          return;
        }

        const student = JSON.parse(storedStudent);
        const studentClass = student.class_No || student.class || student.class_no;

        if (!studentClass) {
          setError("Class information missing from student profile.");
          return;
        }

        const res = await fetch(`http://localhost:4000/api/v1/tests/${studentClass}`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch tests: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        setTests(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("❌ Error fetching tests:", err);
        setError(err.message || "Failed to load upcoming tests");
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingTests();
  }, []);

  /**
   * ⏰ Update current time every minute to refresh test statuses
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Filter out expired tests
  const activeTests = tests.filter(test => !isTestExpired(test));

  // Loading state
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-xl shadow-lg mt-4 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-blue-300 rounded-full"></div>
          <div className="h-4 bg-blue-300 rounded w-48"></div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="h-3 bg-blue-200 rounded w-3/4"></div>
          <div className="h-3 bg-blue-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-xl shadow-lg mt-4">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">⚠</span>
          </div>
          <h3 className="text-lg font-semibold text-red-800">Error Loading Tests</h3>
        </div>
        <p className="text-red-600 mt-2">{error}</p>
      </div>
    );
  }

  // No tests available
  if (activeTests.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-6 rounded-xl shadow-lg mt-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">No Upcoming Tests</h3>
          <p className="text-green-600">You're all caught up! No tests scheduled at the moment.</p>
        </div>
      </div>
    );
  }

  // Render active tests
  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 p-6 rounded-xl shadow-lg mt-4">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
          <span className="text-white font-bold">📢</span>
        </div>
        <h2 className="text-xl font-bold text-yellow-800">
          Upcoming Tests ({activeTests.length})
        </h2>
      </div>

      {/* Tests List */}
      <div className="space-y-4">
        {activeTests.map((test) => {
          const status = getTestStatus(test);
          
          return (
            <div
              key={test._id}
              className={`bg-white rounded-lg p-5 shadow-md border-l-4 hover:shadow-lg transition-shadow duration-200 ${
                status.color === 'green' ? 'border-l-green-500' :
                status.color === 'orange' ? 'border-l-orange-500' :
                status.color === 'blue' ? 'border-l-blue-500' : 'border-l-gray-400'
              }`}
            >
              {/* Test Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {test.subject || 'Test'} - Class {test.class_No}
                  </h3>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    status.color === 'green' ? 'bg-green-100 text-green-800' :
                    status.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                    status.color === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {status.status === 'active' && '🟢 '}
                    {status.status === 'upcoming' && '🔵 '}
                    {status.timeText}
                  </div>
                </div>
              </div>

              {/* Test Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date & Time */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 text-sm">📅</span>
                    <span className="text-sm font-medium text-gray-700">Date:</span>
                    <span className="text-sm text-gray-800">{formatDate(test.date)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 text-sm">🕒</span>
                    <span className="text-sm font-medium text-gray-700">Time:</span>
                    <span className="text-sm text-gray-800">{formatTime(test.time)}</span>
                  </div>
                </div>

                {/* Duration & Marks */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 text-sm">⏱️</span>
                    <span className="text-sm font-medium text-gray-700">Duration:</span>
                    <span className="text-sm text-gray-800">{test.total_marks} minutes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 text-sm">📊</span>
                    <span className="text-sm font-medium text-gray-700">Total Marks:</span>
                    <span className="text-sm text-gray-800">{test.total_marks}</span>
                  </div>
                </div>
              </div>

              {/* Chapters */}
              <div className="mt-4">
                <div className="flex items-start space-x-2">
                  <span className="text-gray-500 text-sm mt-0.5">📚</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">Chapters:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {test.chapters.map((chapter, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
                        >
                          {chapter}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button for Active Tests */}
              {status.status === 'active' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => window.location.href = '/student/test'}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <span>🚀</span>
                    <span>Take Test Now</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-yellow-200">
        <p className="text-xs text-yellow-700 text-center">
          ⏰ Times shown are updated in real-time • Tests automatically removed after completion
        </p>
      </div>
    </div>
  );
};

export default UpcomingTest;
