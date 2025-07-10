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

export { addQuestion };
