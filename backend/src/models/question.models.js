import mongoose, {Schema} from "mongoose";

const questionSchema = new Schema({
    chapter: {
        type: String,
        required: true,
    },
    class: {
        type: Number,
        required: true,
    },
    correctAnswer: {
        type: String,
        required: true,
    },
    // options: {
    //     A: { type: String, required: true },
    //     B: { type: String, required: true },
    //     C: { type: String, required: true },
    //     D: { type: String, required: true },
    // },
    options: {
  type: [String],
  validate: {
    validator: function (val) {
      return Array.isArray(val) && val.length === 4;
    },
    message: 'Exactly 4 options are required'
  },
  required: true
},
    question: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
},
    {timestamps: true});

export const Question = mongoose.model("Question", questionSchema);    