import { Router } from "express";
import testConfigController from "../controllers/testConfig.controllers.js"; 

const router = Router();

router.route("/")
  .post(testConfigController.createTestConfig);

router.route("/:classNo")
  .get(testConfigController.getTestsByClass);

export default router;
