import { Router } from "express";
import {
  registerStudent,
  loginStudent,
  logoutStudent,
  getAllStudents,
  acceptStudent,
  rejectStudent,
  getVerifiedStudents,
  getPendingStudents
} from "../controllers/student.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Register and login
router.route("/register").post(registerStudent);
router.route("/login").post(loginStudent);

// Get all students - consider protecting with verifyJWT if needed
router.route("/all").get(getAllStudents);

// Secured routes
router.route("/logout").post(verifyJWT, logoutStudent);

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

router.route("/accept/:id").patch(verifyJWT, acceptStudent);
router.route("/reject/:id").delete(verifyJWT, rejectStudent);
router.route("/verified").get(verifyJWT, getVerifiedStudents);
router.route("/pending").get(verifyJWT, getPendingStudents);

export default router;