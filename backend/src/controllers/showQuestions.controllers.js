import { Question } from "../models/question.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllQuestions = asyncHandler(async (req, res) => {
  const questions = await Question.find(); // fetch all documents from MongoDB

  res.status(200).json({
    success: true,
    count: questions.length,
    data: questions,
  });
});

export { getAllQuestions };
