const APIUsageLog = require('../models/api_usage_log_model');
const APIKey = require('../models/api_key_model');
const AIModel = require('../models/ai_model');

// Log API usage
exports.logAPIUsage = async (apiKeyId, modelId, inputSummary, responseTimeMs, statusCode) => {
  try {
    const usageLog = new APIUsageLog({
      api_key_id: apiKeyId,
      model_id: modelId,
      input_summary: inputSummary,
      response_time_ms: responseTimeMs,
      status_code: statusCode
    });
    
    await usageLog.save();
    return { success: true, log: usageLog };
  } catch (error) {
    console.error('Error logging API usage:', error);
    return { success: false, error: error.message };
  }
};

// Get usage logs for a specific API key
exports.getAPIKeyUsageLogs = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify the API key exists and belongs to the user
    const apiKey = await APIKey.findById(id);
    if (!apiKey) {
      return res.status(404).json({ message: 'API key not found' });
    }
    
    // Check if the user owns this API key or is the model developer
    const isOwner = apiKey.user_id.toString() === req.user.id;
    
    if (!isOwner) {
      const model = await AIModel.findById(apiKey.model_id);
      const isDeveloper = model && model.developer_id.toString() === req.user.id;
      
      if (!isDeveloper) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    // Get usage logs with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const logs = await APIUsageLog.find({ api_key_id: id })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await APIUsageLog.countDocuments({ api_key_id: id });
    
    res.status(200).json({
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching usage logs', error: error.message });
  }
};

// Get usage logs for a specific model
exports.getModelUsageLogs = async (req, res) => {
  try {
    const { model_id } = req.params;
    
    // Verify the model exists and belongs to the developer
    const model = await AIModel.findById(model_id);
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }
    
    if (model.developer_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get usage logs with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const logs = await APIUsageLog.find({ model_id })
      .populate('api_key_id', 'api_key user_id')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await APIUsageLog.countDocuments({ model_id });
    
    // Get some statistics
    const successCount = await APIUsageLog.countDocuments({ 
      model_id, 
      status_code: { $gte: 200, $lt: 300 } 
    });
    
    const avgResponseTime = await APIUsageLog.aggregate([
      { $match: { model_id: mongoose.Types.ObjectId(model_id) } },
      { $group: { _id: null, avg: { $avg: '$response_time_ms' } } }
    ]);
    
    res.status(200).json({
      logs,
      stats: {
        total,
        success_rate: total > 0 ? (successCount / total) * 100 : 0,
        avg_response_time: avgResponseTime.length > 0 ? avgResponseTime[0].avg : 0
      },
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching model usage logs', error: error.message });
  }
};

// Get user's usage logs across all API keys
exports.getUserUsageLogs = async (req, res) => {
  try {
    // Get all API keys belonging to the user
    const userApiKeys = await APIKey.find({ user_id: req.user.id });
    const apiKeyIds = userApiKeys.map(key => key._id);
    
    // Get usage logs with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const logs = await APIUsageLog.find({ api_key_id: { $in: apiKeyIds } })
      .populate('model_id', 'name category')
      .populate('api_key_id', 'api_key')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await APIUsageLog.countDocuments({ api_key_id: { $in: apiKeyIds } });
    
    res.status(200).json({
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching usage logs', error: error.message });
  }
};

// Get usage statistics for a developer's models
exports.getDeveloperStats = async (req, res) => {
  try {
    // Get all models belonging to the developer
    const developerModels = await AIModel.find({ developer_id: req.user.id });
    const modelIds = developerModels.map(model => model._id);
    
    if (modelIds.length === 0) {
      return res.status(200).json({ 
        message: 'No models found',
        stats: {
          total_calls: 0,
          models_data: []
        }
      });
    }
    
    // Get total API calls
    const totalCalls = await APIUsageLog.countDocuments({ model_id: { $in: modelIds } });
    
    // Get calls per model
    const modelStats = await APIUsageLog.aggregate([
      { $match: { model_id: { $in: modelIds } } },
      { $group: { 
        _id: '$model_id', 
        total_calls: { $sum: 1 },
        avg_response_time: { $avg: '$response_time_ms' },
        success_count: { 
          $sum: { 
            $cond: [
              { $and: [
                { $gte: ['$status_code', 200] },
                { $lt: ['$status_code', 300] }
              ]},
              1,
              0
            ]
          }
        }
      }},
      { $sort: { total_calls: -1 } }
    ]);
    
    // Add model details to stats
    const modelsData = await Promise.all(modelStats.map(async (stat) => {
      const model = await AIModel.findById(stat._id);
      return {
        model_id: stat._id,
        model_name: model.name,
        category: model.category,
        total_calls: stat.total_calls,
        avg_response_time: stat.avg_response_time,
        success_rate: (stat.success_count / stat.total_calls) * 100
      };
    }));
    
    // Get calls over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyStats = await APIUsageLog.aggregate([
      { 
        $match: { 
          model_id: { $in: modelIds },
          created_at: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({
      stats: {
        total_calls: totalCalls,
        models_data: modelsData,
        daily_stats: dailyStats
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching developer statistics', error: error.message });
  }
};