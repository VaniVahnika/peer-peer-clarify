const mongoose = require("mongoose");
const { Schema } = mongoose;

const feedbackSchema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true
    },

    from: {
      type: String,
      enum: ["student", "instructor"],
      required: true
    },

    toUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    ratings: {
      clarity: {
        type: Number,
        min: 1,
        max: 5
      },
      interaction: {
        type: Number,
        min: 1,
        max: 5
      },
      satisfaction: {
        type: Number,
        min: 1,
        max: 5
      }
    },

    message: {
      type: String,
      maxlength: 500
    }
  },
  { timestamps: true }
);

// Enforce ONE feedback per session per role
feedbackSchema.index(
  { sessionId: 1, from: 1 },
  { unique: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
