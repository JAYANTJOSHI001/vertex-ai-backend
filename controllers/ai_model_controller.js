const AIModel = require('../models/ai_model');
const User = require('../models/user_model');

// Create a new AI model
exports.createModel = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      pricing_type,
      price_per_call,
      usage_limit_free,
      model_file_url
    } = req.body;

    // Generate a unique API endpoint
    const apiEndpoint = `/api/models/${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    // Create new AI model
    const aiModel = new AIModel({
      developer_id: req.user.id,
      name,
      description,
      category,
      pricing_type,
      price_per_call: pricing_type === 'per_call' ? price_per_call : 0,
      usage_limit_free: pricing_type === 'free' ? usage_limit_free : 0,
      api_endpoint: apiEndpoint,
      model_file_url,
      status: 'draft'
    });

    await aiModel.save();

    res.status(201).json({
      message: 'AI model created successfully',
      model: aiModel
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating AI model', error: error.message });
  }
};

// Get all AI models (with filtering options)
exports.getAllModels = async (req, res) => {
  try {
    const { category, status, developer_id } = req.query;
    const filter = {};

    // Apply filters if provided
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (developer_id) filter.developer_id = developer_id;

    // Only return active models unless specifically requested or by the developer
    if (!status && (!req.user || req.user.user_type !== 'developer')) {
      filter.status = 'active';
    }

    const models = await AIModel.find(filter)
      .populate('developer_id', 'name email')
      .sort({ created_at: -1 });

    res.status(200).json({ models });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching AI models', error: error.message });
  }
};

// Get a specific AI model by ID
exports.getModelById = async (req, res) => {
  try {
    const model = await AIModel.findById(req.params.id)
      .populate('developer_id', 'name email');

    if (!model) {
      return res.status(404).json({ message: 'AI model not found' });
    }

    // Check if model is active or if the requester is the developer
    if (model.status !== 'active' && 
        (!req.user || req.user.id !== model.developer_id._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({ model });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching AI model', error: error.message });
  }
};

// Update an AI model
exports.updateModel = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      pricing_type,
      price_per_call,
      usage_limit_free,
      model_file_url,
      status
    } = req.body;

    // Find the model
    const model = await AIModel.findById(req.params.id);
    
    if (!model) {
      return res.status(404).json({ message: 'AI model not found' });
    }

    // Check if user is the developer of this model
    if (model.developer_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update model fields
    if (name) model.name = name;
    if (description) model.description = description;
    if (category) model.category = category;
    if (pricing_type) {
      model.pricing_type = pricing_type;
      // Reset related fields based on pricing type
      if (pricing_type === 'free') {
        model.price_per_call = 0;
        if (usage_limit_free) model.usage_limit_free = usage_limit_free;
      } else if (pricing_type === 'per_call') {
        if (price_per_call) model.price_per_call = price_per_call;
        model.usage_limit_free = 0;
      }
    } else {
      // If pricing type not changed, update related fields
      if (price_per_call && model.pricing_type === 'per_call') {
        model.price_per_call = price_per_call;
      }
      if (usage_limit_free && model.pricing_type === 'free') {
        model.usage_limit_free = usage_limit_free;
      }
    }
    
    if (model_file_url) model.model_file_url = model_file_url;
    if (status) model.status = status;

    await model.save();

    res.status(200).json({
      message: 'AI model updated successfully',
      model
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating AI model', error: error.message });
  }
};

// Delete an AI model
exports.deleteModel = async (req, res) => {
  try {
    const model = await AIModel.findById(req.params.id);
    
    if (!model) {
      return res.status(404).json({ message: 'AI model not found' });
    }

    // Check if user is the developer of this model
    if (model.developer_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await AIModel.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'AI model deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting AI model', error: error.message });
  }
};

// Get models by developer
exports.getMyModels = async (req, res) => {
  try {
    const models = await AIModel.find({ developer_id: req.user.id })
      .sort({ created_at: -1 });
    
    res.status(200).json({ models });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your AI models', error: error.message });
  }
};

// Change model status
exports.changeModelStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'draft', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const model = await AIModel.findById(req.params.id);
    
    if (!model) {
      return res.status(404).json({ message: 'AI model not found' });
    }

    // Check if user is the developer of this model
    if (model.developer_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    model.status = status;
    await model.save();
    
    res.status(200).json({
      message: `AI model status changed to ${status}`,
      model
    });
  } catch (error) {
    res.status(500).json({ message: 'Error changing AI model status', error: error.message });
  }
};