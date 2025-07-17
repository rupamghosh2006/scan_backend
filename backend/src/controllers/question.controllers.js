import { asyncHandler } from "../utils/asyncHandler.js";
import { Question } from "../models/question.models.js";

const addQuestion = asyncHandler(async (req, res) => {
  const { chapter, class: classNum, correctAnswer, options, question, subject } = req.body;

  // Basic Validation
  if (!chapter || !classNum || !correctAnswer || !options || !question || !subject) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  if (!Array.isArray(options) || options.length < 2) {
    return res.status(400).json({
      success: false,
      message: "At least two options are required",
    });
  }

  // Create and save question
  const newQuestion = await Question.create({
    chapter,
    class: classNum,
    correctAnswer,
    options,
    question,
    subject,
  });

  res.status(201).json({
    success: true,
    message: "Question added successfully",
    data: newQuestion,
  });
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
