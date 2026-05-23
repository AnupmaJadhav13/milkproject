const asyncHandler = require('express-async-handler');
const MilkCollection = require('../models/MilkCollection');
const Farmer = require('../models/Farmer');
const { sendBonusNotification } = require('../services/notificationService');

const LAKH_TARGET = 100000;
const MIN_SPAN_DAYS = 365;

async function computeEligibleRows() {
  const agg = await MilkCollection.aggregate([
    {
      $group: {
        _id: { farmerId: '$farmerId', centerId: '$collectionCenterId' },
        totalInr: { $sum: '$amountInr' },
        firstDate: { $min: '$date' },
        lastDate: { $max: '$date' },
        entryCount: { $sum: 1 }
      }
    },
    {
      $addFields: {
        spanDays: {
          $floor: {
            $divide: [{ $subtract: ['$lastDate', '$firstDate'] }, 1000 * 60 * 60 * 24]
          }
        }
      }
    },
    {
      $match: {
        totalInr: { $gte: LAKH_TARGET },
        spanDays: { $gte: MIN_SPAN_DAYS }
      }
    }
  ]);

  const farmerIds = agg.map((a) => a._id.farmerId);
  if (farmerIds.length === 0) {
    return [];
  }

  const farmers = await Farmer.find({ _id: { $in: farmerIds } })
    .populate('assignedCenter', 'name centerCode')
    .select('fullName mobileNumber farmerCode assignedCenter annualBonusNotifiedAt');

  const byId = new Map(farmers.map((f) => [f._id.toString(), f]));

  return agg
    .map((row) => {
      const f = byId.get(row._id.farmerId.toString());
      if (!f) return null;
      return {
        farmerId: f._id,
        farmerCode: f.farmerCode,
        fullName: f.fullName,
        mobileNumber: f.mobileNumber,
        centerName: f.assignedCenter?.name,
        centerCode: f.assignedCenter?.centerCode,
        totalInr: row.totalInr,
        firstDate: row.firstDate,
        lastDate: row.lastDate,
        spanDays: row.spanDays,
        entryCount: row.entryCount,
        notified: Boolean(f.annualBonusNotifiedAt),
        notifiedAt: f.annualBonusNotifiedAt
      };
    })
    .filter(Boolean);
}

const getAnnualBonusEligible = asyncHandler(async (req, res) => {
  const rows = await computeEligibleRows();
  res.json({
    targetInr: LAKH_TARGET,
    minSpanDays: MIN_SPAN_DAYS,
    eligible: rows
  });
});

const notifyAnnualBonus = asyncHandler(async (req, res) => {
  const rows = await computeEligibleRows();
  const sent = [];
  const errors = [];

  for (const row of rows) {
    if (row.notified) continue;
      try {
        const farmer = await Farmer.findById(row.farmerId).populate('assignedCenter', 'name');
        if (!farmer) continue;
        sendBonusNotification(farmer._id, {
          farmerName: farmer.fullName,
          centerName: farmer.assignedCenter?.name || 'Your collection center',
          totalInr: row.totalInr
        });
        farmer.annualBonusNotifiedAt = new Date();
        await farmer.save();
        sent.push({ farmerId: farmer._id, farmerCode: farmer.farmerCode });
      } catch (e) {
        errors.push({ farmerId: row.farmerId, message: e.message });
      }
  }

  res.json({
    message: 'Bonus notifications processed',
    sentCount: sent.length,
    sent,
    errors
  });
});

module.exports = { getAnnualBonusEligible, notifyAnnualBonus };
