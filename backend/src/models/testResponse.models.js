import mongoose, { Schema } from "mongoose";

const responseSchema = new Schema({
  questionNumber: { type: Number, required: true },
  questionId: { type: String, required: true },
  selectedOption: { type: String, default: null },
});

const testResponseSchema = new Schema({
    date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
    //unique: true,
  },
  testId: {
      type: Schema.Types.ObjectId,
      ref: "TestConfig",  
      required: true,
    },
  responses: {
    type: [responseSchema],
    required: true,
  },
}, { timestamps: true });

export const TestResponse = mongoose.model("TestResponse", testResponseSchema);
