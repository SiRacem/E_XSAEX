// controllers/notification.controller.js
const Notification = require('../models/Notification');

// Get notifications for the logged-in user
exports.getNotifications = async (req, res) => {
    const userId = req.user?._id;
    console.log(`--- Controller: getNotifications for user ${userId} ---`);
    if (!userId) {
        return res.status(401).json({ msg: "Unauthorized" });
    }

    try {
        // Find notifications, sort by newest first, limit results (e.g., last 50)
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(50) // Example limit
            .lean(); // Use lean for performance

        // Optionally, count unread notifications separately
        const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

        console.log(`Found ${notifications.length} notifications, ${unreadCount} unread.`);
        res.status(200).json({ notifications, unreadCount });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ msg: "Failed to fetch notifications", error: error.message });
    }
};

// Mark specific notifications as read
exports.markNotificationsRead = async (req, res) => {
    const userId = req.user?._id;
    // Expect an array of notification IDs in the request body
    const { notificationIds } = req.body;
    console.log(`--- Controller: markNotificationsRead for user ${userId} ---`);

    if (!userId) return res.status(401).json({ msg: "Unauthorized" });
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({ msg: "Notification IDs array is required." });
    }

    try {
        const result = await Notification.updateMany(
            { _id: { $in: notificationIds }, user: userId, isRead: false }, // Ensure user owns notifications
            { $set: { isRead: true } }
        );

        console.log(`Marked ${result.modifiedCount} notifications as read.`);
        if (result.matchedCount === 0) {
            return res.status(404).json({ msg: "No matching unread notifications found for this user." });
        }

        res.status(200).json({ msg: `${result.modifiedCount} notification(s) marked as read.` });

    } catch (error) {
        console.error("Error marking notifications read:", error);
        res.status(500).json({ msg: "Failed to mark notifications as read", error: error.message });
    }
};

// Optional: Mark ALL notifications as read
exports.markAllNotificationsRead = async (req, res) => {
    const userId = req.user?._id;
    console.log(`--- Controller: markAllNotificationsRead for user ${userId} ---`);
    if (!userId) return res.status(401).json({ msg: "Unauthorized" });

    try {
        const result = await Notification.updateMany(
            { user: userId, isRead: false },
            { $set: { isRead: true } }
        );
        console.log(`Marked ${result.modifiedCount} total notifications as read.`);
        res.status(200).json({ msg: `${result.modifiedCount} notification(s) marked as read.` });
    } catch (error) {
        console.error("Error marking all notifications read:", error);
        res.status(500).json({ msg: "Failed to mark all notifications as read", error: error.message });
    }
};