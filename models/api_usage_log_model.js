const mongoose = require('mongoose');

const apiUsageLogSchema = new mongoose.Schema({
  api_key_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'APIKey',
    required: true
  },
  model_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIModel',
    required: true
  },
  input_summary: {
    type: String,
    default: null
  },
  response_time_ms: {
    type: Number,
    required: true
  },
  status_code: {
    type: Number,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
apiUsageLogSchema.index({ api_key_id: 1 });
apiUsageLogSchema.index({ model_id: 1 });
apiUsageLogSchema.index({ created_at: 1 });

const APIUsageLog = mongoose.model('APIUsageLog', apiUsageLogSchema);

module.exports = APIUsageLog;