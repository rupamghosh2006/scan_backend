import { Router } from "express";
import { sendOtp } from "../controllers/sendOtp.js";
import { checkOtp } from "../controllers/verifyotp.js";

const router = Router();

router.post("/send", sendOtp);
router.post("/check", checkOtp);

export default router;
