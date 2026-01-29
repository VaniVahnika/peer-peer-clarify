const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  resources: [{
    title: String,
    url: String,
    type: { type: String, enum: ['article', 'video', 'course'], default: 'article' }
  }]
});

const roadmapSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true }, // e.g., 'full-stack', 'system-design'
  title: { type: String, required: true },
  description: { type: String },
  nodes: [nodeSchema], // Ordered list of nodes
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Roadmap', roadmapSchema);