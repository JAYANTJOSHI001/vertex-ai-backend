const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  model_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIModel',
    required: true
  },
  api_key: {
    type: String,
    required: true,
    unique: true
  },
  usage_count: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'revoked'],
    default: 'active'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
apiKeySchema.index({ user_id: 1 });
apiKeySchema.index({ model_id: 1 });
apiKeySchema.index({ api_key: 1 }, { unique: true });

const APIKey = mongoose.model('APIKey', apiKeySchema);

module.exports = APIKey;