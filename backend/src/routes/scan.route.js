import { scanPdf } from "../controllers/scan.controller";
import { Router } from "express";

const router = Router()

router.route('/', scanPdf)

export default router