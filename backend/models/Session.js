const mongoose = require("mongoose");
const { Schema } = mongoose;

const sessionSchema = new Schema(
  {
    doubtId: {
      type: Schema.Types.ObjectId,
      ref: "Doubt",
      required: true,
      
    },

    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      
    },

    instructorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      
    },

    // WebRTC room identifier
    roomId: {
      type: String,
      required: true,
      unique: true
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active"
    },

    startedAt: {
      type: Date,
      default: Date.now
    },

    endedAt: {
      type: Date
    }
  },
  { timestamps: true }
);


module.exports = mongoose.model("Session", sessionSchema);
