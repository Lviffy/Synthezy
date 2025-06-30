const mongoose = require('mongoose');

const drawingSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Flexible JSON data for canvas elements
    default: []
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Optional: Add metadata about the drawing
  metadata: {
    title: {
      type: String,
      default: 'Untitled Drawing'
    },
    description: String,
    tags: [String],
    version: {
      type: Number,
      default: 1
    }
  }
});

// Update the updatedAt field on save
drawingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient querying
drawingSchema.index({ sessionId: 1 });
drawingSchema.index({ createdBy: 1 });
drawingSchema.index({ users: 1 });
drawingSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Drawing', drawingSchema);
