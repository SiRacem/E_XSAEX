// router/notification.js
const express = require('express');
const { getNotifications, markNotificationsRead, markAllNotificationsRead } = require('../controllers/notification.controller');
const { verifyAuth } = require('../middlewares/verifyAuth'); // Protect routes

const router = express.Router();

// GET user's notifications
router.get('/', verifyAuth, getNotifications);

// PUT mark specific notifications as read
router.put('/read', verifyAuth, markNotificationsRead);

// PUT mark all notifications as read (Optional)
router.put('/read-all', verifyAuth, markAllNotificationsRead);


module.exports = router;