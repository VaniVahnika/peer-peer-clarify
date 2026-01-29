const mongoose = require("mongoose");
const { Schema } = require('mongoose');

const SessionRequestSchema = new Schema({
  doubtId: {
    type: Schema.Types.ObjectId,
    ref: "Doubt",
    required: false
  },

  studentId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  instructorId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  subject: String,
  message: String,

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "timeout", "completed"],
    default: "pending"
  },

  requestedAt: {
    type: Date,
    default: Date.now
  },

  respondedAt: Date

});

SessionRequestSchema.index({ instructorId: 1, status: 1 });
SessionRequestSchema.index({ studentId: 1, requestedAt: -1 });

module.exports = mongoose.model('SessionRequest', SessionRequestSchema);