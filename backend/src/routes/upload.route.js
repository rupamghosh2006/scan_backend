import { upload } from "../controllers/upload.controller.js";
import { Router } from "express";

const router = Router()

router.post("/", upload)

export default router