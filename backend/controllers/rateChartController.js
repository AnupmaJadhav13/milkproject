const asyncHandler = require('express-async-handler');
const RateChartSettings = require('../models/RateChartSettings');

// @desc  Get rate chart for a specific center
// @route GET /api/admin/rate-chart?centerId=<id>
// @access Admin | CollectionHead (own center only)
const getRateChart = asyncHandler(async (req, res) => {
  const centerId = req.query.centerId;

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
  if (!doc) {
    // Return defaults — not saved yet
    return res.json({
      centerId,
      baseRate:   30,
      fatStepInr: 0.3,
      snfStepInr: 0.5,
      fatMin:     3.0,
      fatMax:     5.5,
      snfMin:     7.5,
      snfMax:     9.0,
      _isDefault: true   // flag so frontend knows it's not saved yet
    });
  }

  res.json(doc);
});

// @desc  Create or update rate chart for a specific center
// @route PUT /api/admin/rate-chart?centerId=<id>
// @access Admin only
const updateRateChart = asyncHandler(async (req, res) => {
  const centerId = req.query.centerId;

  if (!centerId) {
    res.status(400);
    throw new Error('centerId is required');
  }

  const { baseRate, fatStepInr, snfStepInr, fatMin, fatMax, snfMin, snfMax } = req.body;

  const doc = await RateChartSettings.findOneAndUpdate(
    { centerId },
    {
      centerId,
      ...(baseRate    !== undefined && { baseRate:    Number(baseRate)    }),
      ...(fatStepInr  !== undefined && { fatStepInr:  Number(fatStepInr)  }),
      ...(snfStepInr  !== undefined && { snfStepInr:  Number(snfStepInr)  }),
      ...(fatMin      !== undefined && { fatMin:      Number(fatMin)      }),
      ...(fatMax      !== undefined && { fatMax:      Number(fatMax)      }),
      ...(snfMin      !== undefined && { snfMin:      Number(snfMin)      }),
      ...(snfMax      !== undefined && { snfMax:      Number(snfMax)      }),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json(doc);
});

module.exports = { getRateChart, updateRateChart };
