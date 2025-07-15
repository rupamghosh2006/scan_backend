import { Router } from "express";
import { addQuestion } from "../controllers/question.controllers.js";
import { getAllQuestions } from "../controllers/showQuestions.controllers.js";

const router = Router();

router.route("/addQuestion").post(addQuestion);
router.route("/questions").get(getAllQuestions);

export default router;
