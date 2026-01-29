const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const commentSchema = new Schema(
  {
    doubtId: {
      type: Schema.Types.ObjectId,
      ref: "Doubt",
      required: true
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    content: {
      type: String,
      required: true,
      trim: true
    },
    
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

commentSchema.index({ doubtId: 1, createdAt: 1 });

module.exports = mongoose.model("Comment", commentSchema);
