import { Router } from "express";
import { scanpdf } from "../controllers/scan.controllers.js";
import multer from 'multer';

// Configure multer for file upload
const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

const router = Router();

// POST route for PDF upload and conversion
router.route("/")
  .post(upload.single('pdf'), scanpdf);

export default router;
