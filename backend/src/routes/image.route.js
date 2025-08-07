import { upload as uploadControl } from "../controllers/upload.controller.js";
import { upload as uploadMiddleware } from "../middlewares/multer.middleware.js";
import { Router } from "express";

const router = Router();

// Image upload route - uses the same controller but different endpoint
router.post("/", uploadMiddleware.single("pdf"), uploadControl); // Keep "pdf" as field name for consistency

export default router;