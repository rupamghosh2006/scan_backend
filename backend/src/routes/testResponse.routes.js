import { Router } from "express";
import { saveStudentTest } from "../controllers/testResponse.controllers.js";
import { TestResponse } from "../models/testResponse.models.js"

const router = Router();

router.post("/", saveStudentTest); // POST /api/v1/testResponses

router.get("/", async (req, res) => {
  try {
    const responses = await TestResponse.find(); // ✅ correct model query
    res.status(200).json({ success: true, data: responses });
  } catch (err) {
    console.error("Error fetching responses:", err);
    res.status(500).json({ success: false, message: "Failed to fetch responses" });
  }
});

export default router;
