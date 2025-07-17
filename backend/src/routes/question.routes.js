import { Router } from "express";
import { addQuestion, deleteQuestion, updateQuestion } from "../controllers/question.controllers.js";
import { getAllQuestions } from "../controllers/showQuestions.controllers.js";

const router = Router();

router.route("/addQuestion").post(addQuestion);
router.route("/questions").get(getAllQuestions);

// Delete a question by ID
router.route("/questions/:id").delete(deleteQuestion);

// Update a question by ID
router.route("/questions/:id").put(updateQuestion);


export default router;
