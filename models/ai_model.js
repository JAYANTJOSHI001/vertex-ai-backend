const mongoose = require('mongoose');

const aiModelSchema = new mongoose.Schema({
  developer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 150
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    maxlength: 100,
    index: true
  },
  pricing_type: {
    type: String,
    enum: ['free', 'per_call'],
    required: true
  },
  price_per_call: {
    type: Number,
    default: 0.0000,
    min: 0
  },
  usage_limit_free: {
    type: Number,
    default: 100,
    min: 0
  },
  api_endpoint: {
    type: String,
    required: true
  },
  model_file_url: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'draft', 'suspended'],
    default: 'draft'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
aiModelSchema.index({ category: 1 });
aiModelSchema.index({ developer_id: 1 });
aiModelSchema.index({ status: 1 });

const AIModel = mongoose.model('AIModel', aiModelSchema);

module.exports = AIModel;