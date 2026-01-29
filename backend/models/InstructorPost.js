const mongoose = require('mongoose');
const { Schema } = mongoose;

const instructorPostSchema = new Schema({
  instructorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  title: {
    type: String,
    required: true
  },
  
  content: {
    type: String,
    required: true
  },
  
  domain: {
    type: String,
    required: true
  },
  
  tags: [String],
  
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

instructorPostSchema.index({ domain: 1, createdAt: -1 });

module.exports = mongoose.model('InstructorPost', instructorPostSchema);