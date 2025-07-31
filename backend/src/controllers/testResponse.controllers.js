import { asyncHandler } from "../utils/asyncHandler.js";
import { TestResponse } from "../models/testResponse.models.js";

const saveStudentTest = asyncHandler(async (req, res) => {
  console.log("Received test submission:", req.body);

  const { mobile, date, time, testId, responses } = req.body;

  if (!mobile || !date || !time || !testId || !responses || !Array.isArray(responses)) {
    return res.status(400).json({
      success: false,
      message: "Mobile, testId, date, time, and responses are required",
    });
  }

  try {
    // Delete old submission for the same mobile and testId
    await TestResponse.findOneAndDelete({ mobile });

    // Save new submission
    const saved = await TestResponse.create({ mobile, date, time, testId, responses });

    res.status(201).json({
      success: true,
      message: "Test response saved successfully",
      data: saved,
    });
  } catch (error) {
    console.error("Error saving test response:", error);

    return res.status(500).json({
      success: false,
      message: "Server error saving test response.",
      error: error.message, // Remove in production for security
    });
  }
});

export { saveStudentTest };
