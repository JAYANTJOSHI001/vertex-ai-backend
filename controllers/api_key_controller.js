const crypto = require('crypto');
const APIKey = require('../models/api_key_model');
const AIModel = require('../models/ai_model');
const User = require('../models/user_model');

// Generate a unique API key
const generateAPIKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create a new API key
exports.createAPIKey = async (req, res) => {
  try {
    const { model_id } = req.body;
    
    // Check if model exists
    const model = await AIModel.findById(model_id);
    if (!model) {
      return res.status(404).json({ message: 'AI model not found' });
    }
    
    // Check if model is active
    if (model.status !== 'active') {
      return res.status(400).json({ message: 'Cannot generate API key for inactive model' });
    }
    
    // Check if user already has an API key for this model
    const existingKey = await APIKey.findOne({ 
      user_id: req.user.id, 
      model_id,
      status: 'active'
    });
    
    if (existingKey) {
      return res.status(400).json({ 
        message: 'You already have an active API key for this model',
        api_key: existingKey
      });
    }
    
    // Generate a new API key
    const apiKey = new APIKey({
      user_id: req.user.id,
      model_id,
      api_key: generateAPIKey()
    });
    
    await apiKey.save();
    
    res.status(201).json({
      message: 'API key generated successfully',
      api_key: apiKey
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating API key', error: error.message });
  }
};

// Get all API keys for the authenticated user
exports.getMyAPIKeys = async (req, res) => {
  try {
    const apiKeys = await APIKey.find({ user_id: req.user.id })
      .populate('model_id', 'name description category')
      .sort({ created_at: -1 });
    
    res.status(200).json({ api_keys: apiKeys });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching API keys', error: error.message });
  }
};

// Get API key details
exports.getAPIKeyById = async (req, res) => {
  try {
    const apiKey = await APIKey.findById(req.params.id)
      .populate('model_id', 'name description category')
      .populate('user_id', 'name email');
    
    if (!apiKey) {
      return res.status(404).json({ message: 'API key not found' });
    }
    
    // Check if the API key belongs to the authenticated user
    if (apiKey.user_id._id.toString() !== req.user.id && req.user.user_type !== 'developer') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.status(200).json({ api_key: apiKey });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching API key', error: error.message });
  }
};

// Revoke an API key
exports.revokeAPIKey = async (req, res) => {
  try {
    const apiKey = await APIKey.findById(req.params.id);
    
    if (!apiKey) {
      return res.status(404).json({ message: 'API key not found' });
    }
    
    // Check if the API key belongs to the authenticated user
    if (apiKey.user_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Revoke the API key
    apiKey.status = 'revoked';
    await apiKey.save();
    
    res.status(200).json({
      message: 'API key revoked successfully',
      api_key: apiKey
    });
  } catch (error) {
    res.status(500).json({ message: 'Error revoking API key', error: error.message });
  }
};

// Verify and increment usage count for an API key
exports.verifyAPIKey = async (apiKeyString, modelId) => {
  try {
    const apiKey = await APIKey.findOne({ 
      api_key: apiKeyString,
      status: 'active'
    });
    
    if (!apiKey) {
      return { valid: false, message: 'Invalid or revoked API key' };
    }
    
    // Check if the API key is for the requested model
    if (apiKey.model_id.toString() !== modelId) {
      return { valid: false, message: 'API key not valid for this model' };
    }
    
    // Increment usage count
    apiKey.usage_count += 1;
    await apiKey.save();
    
    return { valid: true, apiKey };
  } catch (error) {
    return { valid: false, message: error.message };
  }
};

// Get API keys for a specific model (for model developers)
exports.getAPIKeysForModel = async (req, res) => {
  try {
    const { model_id } = req.params;
    
    // Check if model exists and belongs to the developer
    const model = await AIModel.findById(model_id);
    if (!model) {
      return res.status(404).json({ message: 'AI model not found' });
    }
    
    if (model.developer_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get all API keys for this model
    const apiKeys = await APIKey.find({ model_id })
      .populate('user_id', 'name email')
      .sort({ created_at: -1 });
    
    res.status(200).json({ api_keys: apiKeys });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching API keys', error: error.message });
  }
};