import { Router } from "express";
import { registerStudent, loginStudent, logoutStudent, getAllStudents } from "../controllers/student.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(registerStudent).get(getAllStudents);
router.route("/login").post(loginStudent);

// secured routes

router.route("/logout").post(verifyJWT, logoutStudent)

// Additional secure routes
router.route("/").get(verifyJWT, (req, res) => {
  res.json({
    message: "Welcome to the Dashboard",
    student: req.student,
  });
});

router.route("/scan").get(verifyJWT, (req, res) => {
  res.json({
    message: "Scan page access granted",
    student: req.student,
  });
});


export default router;