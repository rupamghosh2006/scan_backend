import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MathpixRender from './MathpixRender.astro';

// Types
interface Question {
  question: string;
  diagram: string | null;
  options: string[];
}

interface ExtractedResponse {
  success: boolean;
  message: string;
  data: {
    pdf_id: string;
    total_questions: number;
    questions: Question[];
    processing_time: string;
  };
}

interface QuestionToSave {
  question: string;
  options: string[];
  correctAnswer: string;
  class: string;
  chapter: string;
  language: string;
  diagram?: string | null;
}

interface Props {
  chapters?: string[]; // Made optional with default
  backendUrl?: string;
}

const BACKEND = "http://localhost:4000/api/v2";

// Default chapters for math
const DEFAULT_CHAPTERS = [
  "Sets",
  "Relations and Functions", 
  "Trigonometric Functions",
  "Complex Numbers and Quadratic Equations",
  "Linear Inequalities",
  "Permutations and Combinations",
  "Binomial Theorem",
  "Sequences and Series",
  "Straight Lines",
  "Conic Sections",
  "Limits and Derivatives",
  "Mathematical Reasoning",
  "Statistics",
  "Probability"
];

const ScanCheck: React.FC<Props> = ({ 
  chapters = DEFAULT_CHAPTERS, 
  backendUrl = BACKEND 
}) => {
  // State management
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // Current question editing state
  const [editedQuestion, setEditedQuestion] = useState('');
  const [editedOptions, setEditedOptions] = useState<string[]>(['', '', '', '']);
  const [selectedClass, setSelectedClass] = useState('11');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('bengali');
  const [correctAnswer, setCorrectAnswer] = useState('');

  // Initialize edited question when current question changes
  useEffect(() => {
    if (extractedQuestions.length > 0 && currentQuestionIndex < extractedQuestions.length) {
      const current = extractedQuestions[currentQuestionIndex];
      setEditedQuestion(current.question);
      setEditedOptions(current.options.length === 4 ? current.options : ['', '', '', '']);
      setCorrectAnswer(''); // Reset correct answer for each question
    }
  }, [currentQuestionIndex, extractedQuestions]);

  // Set default chapter when chapters change
  useEffect(() => {
    if (chapters.length > 0 && !selectedChapter) {
      setSelectedChapter(chapters[0]);
    }
  }, [chapters]);

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Upload and process PDF
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a PDF file.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);
    
    setIsUploading(true);
    
    try {
      const response = await axios.post(`${backendUrl}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data: ExtractedResponse = response.data;
      
      if (data.success && data.data.questions.length > 0) {
        setExtractedQuestions(data.data.questions);
        setCurrentQuestionIndex(0);
        setSavedCount(0);
        console.log(`Extracted ${data.data.total_questions} questions`);
      } else {
        alert("No questions found in the PDF or processing failed.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Save current question
  const handleSaveQuestion = async () => {
    if (!editedQuestion.trim() || editedOptions.some(opt => !opt.trim()) || !correctAnswer) {
      alert("Please fill in all fields including the correct answer.");
      return;
    }

    const questionData: QuestionToSave = {
      question: editedQuestion.trim(),
      options: editedOptions.map(opt => opt.trim()),
      correctAnswer: correctAnswer,
      class: selectedClass,
      chapter: selectedChapter,
      language: selectedLanguage,
      diagram: extractedQuestions[currentQuestionIndex]?.diagram || null
    };

    setIsSaving(true);

    try {
      await axios.post(`http://localhost:4000/api/v1/scan/addQuestion`, questionData, {
        headers: { "Content-Type": "application/json" },
      });

      setSavedCount(prev => prev + 1);
      
      // Move to next question or finish
      if (currentQuestionIndex < extractedQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        alert(`All ${extractedQuestions.length} questions have been saved successfully!`);
        // Reset state
        setExtractedQuestions([]);
        setCurrentQuestionIndex(0);
        setSavedCount(0);
        setFile(null);
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save question. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Skip current question
  const handleSkipQuestion = () => {
    if (currentQuestionIndex < extractedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Go to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Render KaTeX (basic implementation)
  {/*const renderMath = (text: string) => {
    // Simple math rendering - replace with actual KaTeX if needed
    return text
      .replace(/\$([^$]+)\$/g, '<span style="font-style: italic; color: #2563eb;">$1</span>')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<sup>$1</sup>/<sub>$2</sub>');
  };*/}

  const currentQuestion = extractedQuestions[currentQuestionIndex];
  const hasQuestions = extractedQuestions.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        PDF Question Extractor & Editor
      </h1>

      {/* Upload Section */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8 border">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex space-x-4">
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition">
              📁 Select PDF
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <button
              disabled
              className="bg-gray-400 text-white px-6 py-2 rounded-lg cursor-not-allowed"
            >
              📷 Upload Image (Coming Soon)
            </button>
          </div>
          
          {file && (
            <div className="text-center">
              <p className="text-gray-600">Selected: {file.name}</p>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={`mt-2 px-8 py-2 rounded-lg text-white font-semibold ${
                  isUploading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isUploading ? 'Processing...' : '🚀 Extract Questions'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Question Editor */}
      {hasQuestions && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">
                Question {currentQuestionIndex + 1} of {extractedQuestions.length}
              </span>
              <span className="text-sm text-green-600 font-medium">
                Saved: {savedCount}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${((currentQuestionIndex + 1) / extractedQuestions.length) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text:
            </label>
            <textarea
              value={editedQuestion}
              onChange={(e) => setEditedQuestion(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Edit question text..."
            />
            
            {/* KaTeX Preview */}
            <div className="mt-2 p-3 bg-white border rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Preview:</p>
              {/* <div 
                dangerouslySetInnerHTML={{ 
                  __html: renderMath(editedQuestion) 
                }} 
                className="text-gray-800"
              /> */}
              <MathpixRender text={editedQuestion} />
            </div>
          </div>

          {/* Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['A', 'B', 'C', 'D'].map((letter, index) => (
                <div key={letter} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      value={editedOptions[index]}
                      checked={correctAnswer === editedOptions[index]}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      className="text-blue-600"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Option {letter} (Correct?)
                    </label>
                  </div>
                  <input
                    type="text"
                    value={editedOptions[index]}
                    onChange={(e) => {
                      const newOptions = [...editedOptions];
                      newOptions[index] = e.target.value;
                      setEditedOptions(newOptions);
                      // Update correct answer if this was selected
                      if (correctAnswer === editedOptions[index]) {
                        setCorrectAnswer(e.target.value);
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Option ${letter}`}
                  />
                  {/* Option Preview */}
                  {/* <div 
                    dangerouslySetInnerHTML={{ 
                      __html: renderMath(editedOptions[index]) 
                    }} 
                    className="text-sm text-gray-600 bg-white p-2 border rounded"
                  /> */}
                  <MathpixRender text={editedOptions[index]} />
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class:
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chapter:
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {chapters.map(chapter => (
                  <option key={chapter} value={chapter}>
                    {chapter}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language:
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="bengali">Bengali</option>
                <option value="english">English</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-between">
            <div className="flex gap-2">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentQuestionIndex === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                ← Previous
              </button>
              
              <button
                onClick={handleSkipQuestion}
                disabled={currentQuestionIndex === extractedQuestions.length - 1}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentQuestionIndex === extractedQuestions.length - 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                Skip →
              </button>
            </div>

            <button
              onClick={handleSaveQuestion}
              disabled={isSaving}
              className={`px-6 py-2 rounded-lg font-semibold text-white ${
                isSaving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSaving ? 'Saving...' : '💾 Save Question'}
            </button>
          </div>
        </div>
      )}

      {/* No questions state */}
      {!hasQuestions && !isUploading && (
        <div className="text-center py-12 text-gray-500">
          <p>Upload a PDF to extract and edit questions</p>
        </div>
      )}
    </div>
  );
};

export default ScanCheck;