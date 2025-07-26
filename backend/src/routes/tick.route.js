//This file sends UNIX time format from the backend.. though we gotta do things from server as well
import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ time: Date.now() });
});

export default router;
