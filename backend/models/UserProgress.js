const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true },
  completedNodeIds: [{ type: String }], // Array of node IDs that user marked as done
  currentNodeId: { type: String }, // The first incomplete node
  status: { type: String, enum: ['not-started', 'in-progress', 'completed'], default: 'not-started' },
  progressPercentage: { type: Number, default: 0 }
}, { timestamps: true });

// Ensure unique progress per user per roadmap
userProgressSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);