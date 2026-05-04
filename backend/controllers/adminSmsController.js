const asyncHandler = require('express-async-handler');
const Farmer = require('../models/Farmer');
const CollectionCenter = require('../models/CollectionCenter');
const { sendBulkRawSMS, normalizeIndianMobile } = require('../services/smsService');

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getSmsRecipients = asyncHandler(async (req, res) => {
  const { type = 'farmer', search = '', centerId = '' } = req.query;
  const hasSearch = String(search).trim().length > 0;
  const rx = hasSearch ? new RegExp(escapeRx(String(search).trim()), 'i') : null;

  if (type === 'farmer') {
    let filter = {};
    if (centerId && hasSearch) {
      filter = {
        $and: [
          { assignedCenter: centerId },
          {
            $or: [{ fullName: rx }, { mobileNumber: rx }, { farmerCode: rx }, { village: rx }]
          }
        ]
      };
    } else if (centerId) {
      filter = { assignedCenter: centerId };
    } else if (hasSearch) {
      filter = {
        $or: [{ fullName: rx }, { mobileNumber: rx }, { farmerCode: rx }, { village: rx }]
      };
    }

    const farmers = await Farmer.find(filter)
      .populate('assignedCenter', 'name centerCode')
      .select('fullName mobileNumber farmerCode assignedCenter status')
      .sort({ fullName: 1 })
      .lean();

    const rows = farmers
      .filter((f) => normalizeIndianMobile(f.mobileNumber))
      .map((f) => ({
        id: f._id,
        label: `${f.fullName} (${f.farmerCode})`,
        phone: f.mobileNumber,
        sublabel: f.assignedCenter?.name || '',
        centerId: f.assignedCenter?._id
      }));
    return res.json({ type: 'farmer', recipients: rows });
  }

  if (type === 'collection_head') {
    const phoneClause = { 'collectionHead.mobileNumber': { $exists: true, $ne: '' } };
    let filter = phoneClause;

    if (centerId && hasSearch) {
      filter = {
        $and: [
          { _id: centerId },
          phoneClause,
          {
            $or: [
              { name: rx },
              { centerCode: rx },
              { 'collectionHead.fullName': rx },
              { 'collectionHead.mobileNumber': rx }
            ]
          }
        ]
      };
    } else if (centerId) {
      filter = { _id: centerId, ...phoneClause };
    } else if (hasSearch) {
      filter = {
        ...phoneClause,
        $or: [
          { name: rx },
          { centerCode: rx },
          { 'collectionHead.fullName': rx },
          { 'collectionHead.mobileNumber': rx }
        ]
      };
    }

    const centers = await CollectionCenter.find(filter)
      .select('name centerCode collectionHead')
      .sort({ name: 1 })
      .lean();

    const rows = centers
      .filter((c) => normalizeIndianMobile(c.collectionHead?.mobileNumber))
      .map((c) => ({
        id: c._id,
        label: `${c.name} — ${c.collectionHead?.fullName || 'Head'}`,
        phone: c.collectionHead.mobileNumber,
        sublabel: c.centerCode,
        centerId: c._id
      }));
    return res.json({ type: 'collection_head', recipients: rows });
  }

  res.status(400);
  throw new Error('Invalid type. Use farmer or collection_head');
});

const buildSmsBody = (title, message) => {
  const t = (title || '').trim();
  const m = (message || '').trim();
  if (t && m) return `${t}\n\n${m}`;
  if (t) return t;
  return m;
};

const sendAdminSms = asyncHandler(async (req, res) => {
  const {
    userType,
    recipientMode,
    ids = [],
    centerFilterId = '',
    title = '',
    message = ''
  } = req.body;

  const body = buildSmsBody(title, message);
  if (!body) {
    res.status(400);
    throw new Error('Message or title is required');
  }

  let phones = [];

  if (userType === 'farmer') {
    const base = {};
    if (centerFilterId) base.assignedCenter = centerFilterId;

    if (recipientMode === 'all') {
      const farmers = await Farmer.find(base).select('mobileNumber').lean();
      phones = farmers.map((f) => f.mobileNumber);
    } else if (recipientMode === 'single' || recipientMode === 'multiple') {
      if (!ids.length) {
        res.status(400);
        throw new Error('Select at least one farmer');
      }
      const q = { _id: { $in: ids }, ...base };
      const farmers = await Farmer.find(q).select('mobileNumber').lean();
      phones = farmers.map((f) => f.mobileNumber);
    } else {
      res.status(400);
      throw new Error('Invalid recipientMode');
    }
  } else if (userType === 'collection_head') {
    const phoneClause = { 'collectionHead.mobileNumber': { $exists: true, $ne: '' } };
    let base = phoneClause;
    if (centerFilterId) base = { _id: centerFilterId, ...phoneClause };

    if (recipientMode === 'all') {
      const centers = await CollectionCenter.find(base).select('collectionHead').lean();
      phones = centers.map((c) => c.collectionHead?.mobileNumber);
    } else if (recipientMode === 'single' || recipientMode === 'multiple') {
      if (!ids.length) {
        res.status(400);
        throw new Error('Select at least one collection center');
      }
      const centers = await CollectionCenter.find({ _id: { $in: ids }, ...phoneClause }).select('collectionHead').lean();
      phones = centers.map((c) => c.collectionHead?.mobileNumber);
    } else {
      res.status(400);
      throw new Error('Invalid recipientMode');
    }
  } else {
    res.status(400);
    throw new Error('Invalid userType');
  }

  const result = await sendBulkRawSMS(body, phones);
  res.json({
    message: 'SMS sent successfully',
    recipientCount: result.sent,
    ...result
  });
});

module.exports = { getSmsRecipients, sendAdminSms };
