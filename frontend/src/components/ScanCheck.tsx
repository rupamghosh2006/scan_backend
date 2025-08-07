import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// KaTeX type declarations
declare global {
  interface Window {
    katex: {
      renderToString: (tex: string, options?: { displayMode?: boolean }) => string;
    };
  }
}

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
    file_type?: string;
    pdf_id?: string;
    total_questions: number;
    questions: Question[];
    processing_time: string;
    original_filename?: string;
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
  chapters?: string[];
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

// KaTeX Render Component
const KaTeXRender: React.FC<{ text: string }> = ({ text }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const loadKaTeX = async () => {
      // Load KaTeX CSS
      if (!document.querySelector('link[href*="katex"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/katex.min.css';
        document.head.appendChild(link);
      }

      // Load KaTeX JS
      if (!window.katex) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/katex.min.js';
        script.onload = () => renderMath();
        document.head.appendChild(script);
      } else {
        renderMath();
      }
    };

    const renderMath = () => {
      if (containerRef.current && window.katex) {
        try {
          // Replace LaTeX spacing commands and delimiters
          let processedText = text
            // Replace \quad and \qquad with rule
            .replace(/\\qquad/g, '\\rule{2cm}{1pt}')
            .replace(/\\quad/g, '\\rule{1cm}{1pt}')
            // Handle display math ($$...$$)
            .replace(/\$\$([^$]+)\$\$/g, (match, math) => {
              try {
                return window.katex.renderToString(math, { displayMode: true });
              } catch (e) {
                console.warn('KaTeX rendering failed for:', math);
                return match; // Return original if rendering fails
              }
            })
            // Handle inline math ($...$)
            .replace(/\$([^$]+)\$/g, (match, math) => {
              try {
                return window.katex.renderToString(math, { displayMode: false });
              } catch (e) {
                console.warn('KaTeX rendering failed for:', math);
                return match; // Return original if rendering fails
              }
            });

          containerRef.current.innerHTML = processedText;
        } catch (error) {
          // Fallback to plain text if rendering fails
          if (containerRef.current) {
            containerRef.current.textContent = text;
          }
        }
      }
    };

    loadKaTeX();
  }, [text]);

  return <div ref={containerRef} className="katex-container">{text}</div>;
};

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
  
  // Track saved questions by index
  const [savedQuestions, setSavedQuestions] = useState<Set<number>>(new Set());

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
  }, [chapters, selectedChapter]);

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileType = selectedFile.type;
      
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp'
      ];
      
      if (!allowedTypes.includes(fileType)) {
        alert("Please select a PDF or image file (JPEG, PNG, GIF, WebP)");
        return;
      }
      
      setFile(selectedFile);
    }
  };

  // Upload and process file
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file); // Keep "pdf" as field name for consistency
    
    setIsUploading(true);
    
    try {
      // Use the same upload endpoint for both PDFs and images
      const response = await axios.post(`${backendUrl}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data: ExtractedResponse = response.data;
      console.log(data);
      
      if (data.success && data.data.questions.length > 0) {
        setExtractedQuestions(data.data.questions);
        setCurrentQuestionIndex(0);
        setSavedCount(0);
        setSavedQuestions(new Set());
        console.log(`Extracted ${data.data.total_questions} questions from ${data.data.file_type || 'PDF'}`);
      } else {
        alert("No questions found in the file or processing failed.");
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

      // Mark current question as saved
      setSavedQuestions(prev => new Set([...prev, currentQuestionIndex]));
      setSavedCount(prev => prev + 1);
      
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save question. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Go to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < extractedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions processed
      alert(`All ${extractedQuestions.length} questions have been processed! Saved: ${savedCount}`);
      // Reset state
      setExtractedQuestions([]);
      setCurrentQuestionIndex(0);
      setSavedCount(0);
      setSavedQuestions(new Set());
      setFile(null);
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

  const currentQuestion = extractedQuestions[currentQuestionIndex];
  const hasQuestions = extractedQuestions.length > 0;
  const isCurrentQuestionSaved = savedQuestions.has(currentQuestionIndex);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        PDF & Image Question Extractor & Editor
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
            <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition">
              📷 Select Image
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          
          {file && (
            <div className="text-center">
              <p className="text-gray-600">
                Selected: {file.name}
                <span className="text-sm text-gray-500 ml-2">
                  ({file.type.startsWith('image/') ? 'Image' : 'PDF'})
                </span>
              </p>
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
          {/* Question Status Badge */}
          <div className="mb-4">
            {isCurrentQuestionSaved ? (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Question Saved
              </div>
            ) : (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                Not Saved
              </div>
            )}
          </div>

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
              rows={6}
              placeholder="Edit question text..."
              disabled={isCurrentQuestionSaved}
            />
            
            {/* KaTeX Preview */}
            <div className="mt-2 p-3 bg-white border rounded-lg max-h-40 overflow-y-auto">
              <p className="text-xs text-gray-500 mb-1">Preview:</p>
              <KaTeXRender text={editedQuestion} />
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
                      disabled={isCurrentQuestionSaved}
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
                    disabled={isCurrentQuestionSaved}
                  />
                  {/* Option Preview */}
                  <div className="text-sm text-gray-600 bg-white p-2 border rounded max-h-20 overflow-y-auto">
                    <KaTeXRender text={editedOptions[index]} />
                  </div>
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
                disabled={isCurrentQuestionSaved}
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
                disabled={isCurrentQuestionSaved}
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
                disabled={isCurrentQuestionSaved}
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

            {/* Save/Next Button */}
            {isCurrentQuestionSaved ? (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700"
              >
                {currentQuestionIndex === extractedQuestions.length - 1 ? '🏁 Finish' : 'Next →'}
              </button>
            ) : (
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
            )}
          </div>
        </div>
      )}

      {/* No questions state */}
      {!hasQuestions && !isUploading && (
        <div className="text-center py-12 text-gray-500">
          <p>Upload a PDF or image file to extract and edit questions</p>
          <p className="text-sm mt-2">Supported: PDF, JPEG, PNG, GIF, WebP</p>
        </div>
      )}
    </div>
  );
};

export default ScanCheck;