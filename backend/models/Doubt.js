const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const DoubtSchema = new Schema({
  title: { type: String, required: true },

  description: { type: String, required: true },

  domain: {
    type: String,
    required: true
  },

  codeSnippet: {
    type: String
  },

  studentId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  status: {
    type: String,
    enum: ["open", "in_session", "resolved"],
    default: "open"
  },

  isDeleted: {
    type: Boolean,
    default: false
  },

  commentsCount: {
    type: Number,
    default: 0
  },

  vote:{
    type:Number,
    default:0
  }

}, { timestamps: true });


module.exports = mongoose.model("Doubt", DoubtSchema);