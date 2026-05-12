const asyncHandler = require('express-async-handler');
const RateChartSettings = require('../models/RateChartSettings');

const getRateChart = asyncHandler(async (req, res) => {
  let doc = await RateChartSettings.findOne({ key: 'default' });
  if (!doc) {
    doc = await RateChartSettings.create({ key: 'default' });
  }
  res.json(doc);
});

const updateRateChart = asyncHandler(async (req, res) => {
  const { baseRate, fatStepInr, snfStepInr, fatMin, fatMax, snfMin, snfMax } = req.body;
  let doc = await RateChartSettings.findOne({ key: 'default' });
  if (!doc) {
    doc = new RateChartSettings({ key: 'default' });
  }
  if (baseRate !== undefined) doc.baseRate = Number(baseRate);
  if (fatStepInr !== undefined) doc.fatStepInr = Number(fatStepInr);
  if (snfStepInr !== undefined) doc.snfStepInr = Number(snfStepInr);
  if (fatMin !== undefined) doc.fatMin = Number(fatMin);
  if (fatMax !== undefined) doc.fatMax = Number(fatMax);
  if (snfMin !== undefined) doc.snfMin = Number(snfMin);
  if (snfMax !== undefined) doc.snfMax = Number(snfMax);
  await doc.save();
  res.json(doc);
});

module.exports = { getRateChart, updateRateChart };
