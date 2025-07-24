import TestConfig from "../models/testConfig.models.js";

// POST /api/tests
const createTestConfig = async (req, res) => {
  try {
    const { date, time, class_No, chapters, total_marks } = req.body;

    if (!date || !time || !class_No || !chapters || !total_marks) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newTest = new TestConfig({
      date,
      time,
      class_No,
      chapters,
      total_marks,
      // createdBy: req.user?.id // optional for future
    });

    const savedTest = await newTest.save();
    res.status(201).json({ message: "Test configuration saved", test: savedTest });
  } catch (error) {
    console.error("Error saving test config:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/tests/:classNo
const getTestsByClass = async (req, res) => {
  const classNo = parseInt(req.params.classNo);

  try {
    const tests = await TestConfig.find({ class_No: classNo }).sort({ createdAt: -1 });
    res.status(200).json(tests);
  } catch (error) {
    console.error("Error fetching tests:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export default {
  createTestConfig,
  getTestsByClass,
};
