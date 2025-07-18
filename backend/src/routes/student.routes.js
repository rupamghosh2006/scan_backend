import { Router } from "express";
import { registerStudent, loginStudent, logoutStudent } from "../controllers/student.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(registerStudent)
router.route("/login").post(loginStudent);

// secured routes

router.route("/logout").post(verifyJWT, logoutStudent)

export default router;