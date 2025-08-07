import { asyncHandler } from "../utils/asyncHandler.js";
import { Question } from "../models/question.models.js";

const addQuestion = asyncHandler(async (req, res) => {
  const { 
    chapter, 
    class: classNum, 
    correctAnswer, 
    options, 
    question, 
    language,
    diagram 
  } = req.body;

  // Basic Validation
  if (!chapter || !classNum || !correctAnswer || !options || !question || !language) {
    return res.status(400).json({
      success: false,
      message: "All required fields must be provided (chapter, class, correctAnswer, options, question, language)",
    });
  }

  if (!Array.isArray(options) || options.length < 2) {
    return res.status(400).json({
      success: false,
      message: "At least two options are required",
    });
  }

  // Validate that correctAnswer exists in options
  if (!options.includes(correctAnswer)) {
    return res.status(400).json({
      success: false,
      message: "Correct answer must be one of the provided options",
    });
  }

  // Validate class value
  if (!['11', '12'].includes(classNum)) {
    return res.status(400).json({
      success: false,
      message: "Class must be either '11' or '12'",
    });
  }

  // Validate language value
  if (!['bengali', 'english'].includes(language)) {
    return res.status(400).json({
      success: false,
      message: "Language must be either 'bengali' or 'english'",
    });
  }

  try {
    // Create and save question
    const newQuestion = await Question.create({
      chapter,
      class: classNum,
      correctAnswer,
      options,
      question,
      language,
      diagram: diagram || null, // Optional diagram field
      // You might want to add a default subject or make it configurable
      subject: 'Mathematics' // Default subject, or you can make this dynamic
    });

    res.status(201).json({
      success: true,
      message: "Question added successfully",
      data: newQuestion,
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({
      success: false,
      message: "Failed to create question",
      error: error.message
    });
  }
});

// Delete a question by ID
const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const question = await Question.findByIdAndDelete(id);

  if (!question) {
    return res.status(404).json({
      success: false,
      message: "Question not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Question deleted successfully",
  });
});

// Update a question by ID
const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { chapter, class: classNum, correctAnswer, options, question, subject } = req.body;

  const updated = await Question.findByIdAndUpdate(
    id,
    {
      chapter,
      class: classNum,
      correctAnswer,
      options,
      question,
      subject,
    },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({
      success: false,
      message: "Question not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Question updated successfully",
    data: updated,
  });
});

export {
  addQuestion,
  deleteQuestion,
  updateQuestion
};
