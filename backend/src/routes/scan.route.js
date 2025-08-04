import { Router } from "express";
import { scanpdf } from "../controllers/scan.controllers.js";
import { upload } from "../middlewares/scan.middleware.js";

const router = Router();

router.post("/", upload.single("pdf"), scanpdf);

export default router;
