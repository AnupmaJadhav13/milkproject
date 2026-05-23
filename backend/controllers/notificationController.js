const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const Farmer = require('../models/Farmer');
const CollectionCenter = require('../models/CollectionCenter');
const { sendCustomNotification } = require('../services/notificationService');
const { emitToFarmer } = require('../socket');

// ── Farmer: Get own notifications ─────────────────────────────────────────────

const getMyNotifications = asyncHandler(async (req, res) => {
  const farmerId = req.user.farmerId || req.user._id;
  const { page = 1, limit = 20, unreadOnly } = req.query;

  const pageNo = Math.max(1, Number(page));
  const pageSize = Math.min(50, Number(limit));
  const filter = { farmerId };
  if (unreadOnly === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNo - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ farmerId, isRead: false })
  ]);

  res.json({
    success: true,
    data: notifications,
    total,
    unreadCount,
    currentPage: pageNo,
    totalPages: Math.ceil(total / pageSize)
  });
});

// ── Farmer: Mark notification(s) as read ─────────────────────────────────────

const markAsRead = asyncHandler(async (req, res) => {
  const farmerId = req.user.farmerId || req.user._id;
  const { notificationId } = req.params;

  if (notificationId === 'all' || !notificationId) {
    await Notification.updateMany({ farmerId, isRead: false }, { $set: { isRead: true } });
    emitToFarmer(farmerId, 'notification:unread-count', { unreadCount: 0 });
    return res.json({ success: true, message: 'All notifications marked as read' });
  }

  const notification = await Notification.findOne({ _id: notificationId, farmerId });
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  notification.isRead = true;
  await notification.save();
  const unreadCount = await Notification.countDocuments({ farmerId, isRead: false });
  emitToFarmer(farmerId, 'notification:read', { notificationId, unreadCount });
  emitToFarmer(farmerId, 'notification:unread-count', { unreadCount });

  res.json({ success: true, message: 'Notification marked as read' });
});

// ── Farmer: Get unread count ──────────────────────────────────────────────────

const getUnreadCount = asyncHandler(async (req, res) => {
  const farmerId = req.user.farmerId || req.user._id;
  const count = await Notification.countDocuments({ farmerId, isRead: false });
  res.json({ success: true, unreadCount: count });
});

// ── Admin: Send notification to farmers (replaces Send SMS) ──────────────────

const sendAdminNotification = asyncHandler(async (req, res) => {
  const { userType, recipientMode, ids = [], centerFilterId = '', title = '', message = '' } = req.body;

  const titleClean = String(title || '').trim();
  const messageClean = String(message || '').trim();

  if (!titleClean && !messageClean) {
    res.status(400);
    throw new Error('Title or message is required');
  }

  if (titleClean.length > 200) {
    res.status(400);
    throw new Error('Title cannot exceed 200 characters');
  }

  if (messageClean.length > 2000) {
    res.status(400);
    throw new Error('Message cannot exceed 2000 characters');
  }

  if (!['farmer', 'collection_head'].includes(userType)) {
    res.status(400);
    throw new Error('Invalid userType. Use farmer or collection_head');
  }

  if (!['all', 'single', 'multiple'].includes(recipientMode)) {
    res.status(400);
    throw new Error('Invalid recipientMode. Use all, single, or multiple');
  }

  const finalTitle = titleClean || 'संदेश';
  const finalMessage = messageClean || titleClean;

  let farmerIds = [];

  if (userType === 'farmer') {
    const base = {};
    if (centerFilterId) base.assignedCenter = centerFilterId;

    if (recipientMode === 'all') {
      const farmers = await Farmer.find(base).select('_id').lean();
      farmerIds = farmers.map((f) => f._id);
    } else if (recipientMode === 'single' || recipientMode === 'multiple') {
      if (!ids.length) {
        res.status(400);
        throw new Error('Select at least one farmer');
      }
      const q = { _id: { $in: ids }, ...base };
      const farmers = await Farmer.find(q).select('_id').lean();
      farmerIds = farmers.map((f) => f._id);
    } else {
      res.status(400);
      throw new Error('Invalid recipientMode');
    }
  } else if (userType === 'collection_head') {
    // For collection heads, find all farmers in those centers
    let centerIds = [];
    if (recipientMode === 'all') {
      const centers = await CollectionCenter.find({}).select('_id').lean();
      centerIds = centers.map((c) => c._id);
    } else if (recipientMode === 'single' || recipientMode === 'multiple') {
      if (!ids.length) {
        res.status(400);
        throw new Error('Select at least one collection center');
      }
      centerIds = ids;
    }
    const farmers = await Farmer.find({ assignedCenter: { $in: centerIds } }).select('_id').lean();
    farmerIds = farmers.map((f) => f._id);
  } else {
    res.status(400);
    throw new Error('Invalid userType');
  }

  if (farmerIds.length === 0) {
    return res.json({ success: true, message: 'No farmers found for selected recipients', sentCount: 0 });
  }

  const result = await sendCustomNotification(farmerIds, finalTitle, finalMessage);

  res.json({
    success: true,
    message: 'Notifications sent successfully',
    sentCount: result.sent,
    errorCount: result.errors.length
  });
});

// ── Admin: Get recipients list (for notification UI) ─────────────────────────

const getNotificationRecipients = asyncHandler(async (req, res) => {
  const { type = 'farmer', search = '', centerId = '' } = req.query;
  const hasSearch = String(search).trim().length > 0;
  const rx = hasSearch ? new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;

  if (type === 'farmer') {
    let filter = {};
    if (centerId && hasSearch) {
      filter = { $and: [{ assignedCenter: centerId }, { $or: [{ fullName: rx }, { mobileNumber: rx }, { farmerCode: rx }, { village: rx }] }] };
    } else if (centerId) {
      filter = { assignedCenter: centerId };
    } else if (hasSearch) {
      filter = { $or: [{ fullName: rx }, { mobileNumber: rx }, { farmerCode: rx }, { village: rx }] };
    }

    const farmers = await Farmer.find(filter)
      .populate('assignedCenter', 'name centerCode')
      .select('fullName mobileNumber farmerCode assignedCenter status')
      .sort({ fullName: 1 })
      .lean();

    const rows = farmers.map((f) => ({
      id: f._id,
      label: `${f.fullName} (${f.farmerCode})`,
      phone: f.mobileNumber,
      sublabel: f.assignedCenter?.name || '',
      centerId: f.assignedCenter?._id
    }));
    return res.json({ type: 'farmer', recipients: rows });
  }

  if (type === 'collection_head') {
    let filter = {};
    if (centerId && hasSearch) {
      filter = { $and: [{ _id: centerId }, { $or: [{ name: rx }, { centerCode: rx }, { 'collectionHead.fullName': rx }] }] };
    } else if (centerId) {
      filter = { _id: centerId };
    } else if (hasSearch) {
      filter = { $or: [{ name: rx }, { centerCode: rx }, { 'collectionHead.fullName': rx }] };
    }

    const centers = await CollectionCenter.find(filter)
      .select('name centerCode collectionHead')
      .sort({ name: 1 })
      .lean();

    const rows = centers.map((c) => ({
      id: c._id,
      label: `${c.name} — ${c.collectionHead?.fullName || 'Head'}`,
      phone: c.collectionHead?.mobileNumber || '',
      sublabel: c.centerCode,
      centerId: c._id
    }));
    return res.json({ type: 'collection_head', recipients: rows });
  }

  res.status(400);
  throw new Error('Invalid type. Use farmer or collection_head');
});

// ── Admin: Get all notifications (for admin view) ─────────────────────────────

const getAllNotifications = asyncHandler(async (req, res) => {
  const { farmerId, type, isRead, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (farmerId) filter.farmerId = farmerId;
  if (type) filter.type = type;
  if (isRead !== undefined) filter.isRead = isRead === 'true';

  const pageNo = Math.max(1, Number(page));
  const pageSize = Math.min(100, Number(limit));

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .populate('farmerId', 'fullName farmerCode mobileNumber')
      .sort({ createdAt: -1 })
      .skip((pageNo - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Notification.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: notifications,
    total,
    currentPage: pageNo,
    totalPages: Math.ceil(total / pageSize)
  });
});

module.exports = {
  getMyNotifications,
  markAsRead,
  getUnreadCount,
  sendAdminNotification,
  getNotificationRecipients,
  getAllNotifications
};
