import { asyncHandler } from "../utils/asyncHandler.js";
import { TestResponse } from "../models/testResponse.models.js";

const saveStudentTest = asyncHandler(async (req, res) => {
  const { mobile, date, time, responses } = req.body;

  if (!mobile || !date || !time || !responses || !Array.isArray(responses)) {
    return res.status(400).json({
      success: false,
      message: "Mobile and responses are required",
    });
  }

  // Remove old if exists
  await TestResponse.findOneAndDelete({ mobile });

  // Save new
  const saved = await TestResponse.create({ mobile, date, time, responses });

  res.status(201).json({
    success: true,
    message: "Test response saved successfully",
    data: saved,
  });
});

export { saveStudentTest };
