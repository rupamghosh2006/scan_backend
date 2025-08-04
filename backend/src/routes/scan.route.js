import { Router } from "express";

const router = Router();

router.route("/")
  .post(upload.single('pdf'), scanpdf);

export default router;
