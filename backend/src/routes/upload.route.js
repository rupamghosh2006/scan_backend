import { upload as uploadControl } from "../controllers/upload.controller.js";
import { upload as uploadMiddleware } from "../middlewares/multer.middleware.js";
import { Router } from "express";

const router = Router()

router.post("/", uploadMiddleware.single("pdf"), uploadControl)

export default router