import { scanpdf } from "../controllers/scan.controllers.js";
import multer from 'multer';

const scanMiddleware = () => {
    // Configure multer for file upload
    const storage = multer.memoryStorage(); // Store file in memory
    const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit (nice try claude but i don't know if that would be enough sometimes)
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
        cb(null, true);
        } else {
        cb(new Error('Only PDF files are allowed'), false);
        }
    }
    });

    return (upload.single('pdf'))
}