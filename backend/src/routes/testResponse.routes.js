import { Router } from "express";
import { saveStudentTest } from "../controllers/testResponse.controllers.js";

const router = Router();

router.post("/", saveStudentTest); // POST /api/v1/testResponses

export default router;
