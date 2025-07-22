import { Router } from "express";
import { sendOtp, checkOtp } from "../controllers/sendOtp.js";

const router = Router();

router.post("/send", sendOtp);
router.post("/check", checkOtp);

export default router;
