import mongoose, { Schema } from "mongoose";

const testConfigSchema = new Schema(
  {
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    class_No: {
      type: Number,
      enum: [11, 12],
      required: true,
    },
    chapters: {
      type: [String],
      required: true,
    },
    total_marks: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TestConfig = mongoose.model("TestConfig", testConfigSchema);

export default TestConfig;
