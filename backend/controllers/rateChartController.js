const asyncHandler = require('express-async-handler');
const RateChartSettings = require('../models/RateChartSettings');

// @desc  Get rate chart for a specific center
// @route GET /api/admin/rate-chart?centerId=<id>&animalType=<Cow|Buffalo>
// @access Admin | CollectionHead (own center only)
const getRateChart = asyncHandler(async (req, res) => {
  const centerId = req.query.centerId;
  const animalType = req.query.animalType || 'Cow'; // Default to Cow

  if (!centerId) {
    res.status(400);
    throw new Error('centerId is required');
  }

  // Collection head can only read their own center's rate chart
  if (req.user.role === 'collection_head') {
    if (String(req.user.assignedCenter) !== String(centerId)) {
      res.status(403);
      throw new Error('You can only view your own center\'s rate chart');
    }
  }

  let doc = await RateChartSettings.findOne({ centerId });
  
  const animalKey = animalType.toLowerCase(); // 'cow' or 'buffalo'
  
  if (!doc) {
    // Return defaults — not saved yet
    const defaults = {
      cow: {
        baseRate: 30,
        fatSteps: [{ fromValue: 3.0, stepRate: 0.3 }],
        snfSteps: [{ fromValue: 7.5, stepRate: 0.5 }],
        fatMin: 3.0,
        fatMax: 5.5,
        snfMin: 7.5,
        snfMax: 9.0
      },
      buffalo: {
        baseRate: 35,
        fatSteps: [{ fromValue: 5.0, stepRate: 0.5 }],
        snfSteps: [{ fromValue: 8.0, stepRate: 0.6 }],
        fatMin: 5.0,
        fatMax: 7.0,
        snfMin: 8.0,
        snfMax: 9.5
      }
    };
    
    return res.json({
      centerId,
      animalType,
      ...defaults[animalKey],
      _isDefault: true   // flag so frontend knows it's not saved yet
    });
  }

  // Migrate old format to new format if needed
  if (!doc.cow || !doc.cow.baseRate) {
    // Old format - migrate to cow
    doc.cow = {
      baseRate: doc.baseRate || 30,
      fatSteps: doc.fatSteps || [{ fromValue: doc.fatMin || 3.0, stepRate: doc.fatStepInr || 0.3 }],
      snfSteps: doc.snfSteps || [{ fromValue: doc.snfMin || 7.5, stepRate: doc.snfStepInr || 0.5 }],
      fatMin: doc.fatMin || 3.0,
      fatMax: doc.fatMax || 5.5,
      snfMin: doc.snfMin || 7.5,
      snfMax: doc.snfMax || 9.0
    };
  }
  
  if (!doc.buffalo || !doc.buffalo.baseRate) {
    // Set buffalo defaults
    doc.buffalo = {
      baseRate: 35,
      fatSteps: [{ fromValue: 5.0, stepRate: 0.5 }],
      snfSteps: [{ fromValue: 8.0, stepRate: 0.6 }],
      fatMin: 5.0,
      fatMax: 7.0,
      snfMin: 8.0,
      snfMax: 9.5
    };
  }

  // Return the requested animal type's settings
  const animalSettings = doc[animalKey];
  
  // Convert Mongoose subdocument to plain object
  const plainSettings = animalSettings.toObject ? animalSettings.toObject() : animalSettings;
  
  res.json({
    centerId: doc.centerId,
    animalType,
    baseRate: plainSettings.baseRate,
    fatSteps: plainSettings.fatSteps,
    snfSteps: plainSettings.snfSteps,
    fatMin: plainSettings.fatMin,
    fatMax: plainSettings.fatMax,
    snfMin: plainSettings.snfMin,
    snfMax: plainSettings.snfMax,
    _id: doc._id
  });
});

// @desc  Create or update rate chart for a specific center
// @route PUT /api/admin/rate-chart?centerId=<id>&animalType=<Cow|Buffalo>
// @access Admin only
const updateRateChart = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const centerId = req.query.centerId;
  const animalType = req.query.animalType || 'Cow';

  if (!centerId) {
    res.status(400);
    throw new Error('centerId is required');
  }

  const { baseRate, fatSteps, snfSteps, fatMin, fatMax, snfMin, snfMax } = req.body;

  // Validate fatSteps and snfSteps arrays
  if (fatSteps && Array.isArray(fatSteps)) {
    for (const step of fatSteps) {
      if (typeof step.fromValue !== 'number' || typeof step.stepRate !== 'number') {
        res.status(400);
        throw new Error('Each FAT step must have fromValue and stepRate as numbers');
      }
    }
  }

  if (snfSteps && Array.isArray(snfSteps)) {
    for (const step of snfSteps) {
      if (typeof step.fromValue !== 'number' || typeof step.stepRate !== 'number') {
        res.status(400);
        throw new Error('Each SNF step must have fromValue and stepRate as numbers');
      }
    }
  }

  const animalKey = animalType.toLowerCase(); // 'cow' or 'buffalo'
  
  // Build the update object for the specific animal type
  const animalUpdate = {};
  if (baseRate !== undefined) animalUpdate.baseRate = Number(baseRate);
  if (fatSteps !== undefined) {
    animalUpdate.fatSteps = fatSteps.map(s => ({ 
      fromValue: Number(s.fromValue), 
      stepRate: Number(s.stepRate) 
    }));
  }
  if (snfSteps !== undefined) {
    animalUpdate.snfSteps = snfSteps.map(s => ({ 
      fromValue: Number(s.fromValue), 
      stepRate: Number(s.stepRate) 
    }));
  }
  if (fatMin !== undefined) animalUpdate.fatMin = Number(fatMin);
  if (fatMax !== undefined) animalUpdate.fatMax = Number(fatMax);
  if (snfMin !== undefined) animalUpdate.snfMin = Number(snfMin);
  if (snfMax !== undefined) animalUpdate.snfMax = Number(snfMax);

  // Convert centerId to ObjectId
  const centerObjectId = new mongoose.Types.ObjectId(centerId);

  // Find existing document or create new one
  let doc = await RateChartSettings.findOne({ centerId: centerObjectId });
  
  if (!doc) {
    // Create new document with defaults for both animals
    doc = new RateChartSettings({
      centerId: centerObjectId,
      cow: {
        baseRate: 30,
        fatSteps: [{ fromValue: 3.0, stepRate: 0.3 }],
        snfSteps: [{ fromValue: 7.5, stepRate: 0.5 }],
        fatMin: 3.0,
        fatMax: 5.5,
        snfMin: 7.5,
        snfMax: 9.0
      },
      buffalo: {
        baseRate: 35,
        fatSteps: [{ fromValue: 5.0, stepRate: 0.5 }],
        snfSteps: [{ fromValue: 8.0, stepRate: 0.6 }],
        fatMin: 5.0,
        fatMax: 7.0,
        snfMin: 8.0,
        snfMax: 9.5
      }
    });
  }
  
  // Ensure the animal key exists before updating
  if (!doc[animalKey]) {
    // Initialize with defaults if doesn't exist
    const defaults = {
      cow: {
        baseRate: 30,
        fatSteps: [{ fromValue: 3.0, stepRate: 0.3 }],
        snfSteps: [{ fromValue: 7.5, stepRate: 0.5 }],
        fatMin: 3.0,
        fatMax: 5.5,
        snfMin: 7.5,
        snfMax: 9.0
      },
      buffalo: {
        baseRate: 35,
        fatSteps: [{ fromValue: 5.0, stepRate: 0.5 }],
        snfSteps: [{ fromValue: 8.0, stepRate: 0.6 }],
        fatMin: 5.0,
        fatMax: 7.0,
        snfMin: 8.0,
        snfMax: 9.5
      }
    };
    doc[animalKey] = defaults[animalKey];
  }
  
  // Update the specific animal type fields individually
  // IMPORTANT: Cannot use spread operator on Mongoose subdocuments
  if (animalUpdate.baseRate !== undefined) doc[animalKey].baseRate = animalUpdate.baseRate;
  if (animalUpdate.fatSteps !== undefined) doc[animalKey].fatSteps = animalUpdate.fatSteps;
  if (animalUpdate.snfSteps !== undefined) doc[animalKey].snfSteps = animalUpdate.snfSteps;
  if (animalUpdate.fatMin !== undefined) doc[animalKey].fatMin = animalUpdate.fatMin;
  if (animalUpdate.fatMax !== undefined) doc[animalKey].fatMax = animalUpdate.fatMax;
  if (animalUpdate.snfMin !== undefined) doc[animalKey].snfMin = animalUpdate.snfMin;
  if (animalUpdate.snfMax !== undefined) doc[animalKey].snfMax = animalUpdate.snfMax;
  
  // Mark the nested object as modified so Mongoose saves it
  doc.markModified(animalKey);
  
  await doc.save();

  // Convert to plain object for response
  const plainSettings = doc[animalKey].toObject ? doc[animalKey].toObject() : doc[animalKey];

  // Return the updated animal settings
  res.json({
    centerId: doc.centerId,
    animalType,
    baseRate: plainSettings.baseRate,
    fatSteps: plainSettings.fatSteps,
    snfSteps: plainSettings.snfSteps,
    fatMin: plainSettings.fatMin,
    fatMax: plainSettings.fatMax,
    snfMin: plainSettings.snfMin,
    snfMax: plainSettings.snfMax,
    _id: doc._id
  });
});

module.exports = { getRateChart, updateRateChart };
