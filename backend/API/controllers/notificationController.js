const Notification = require('../../models/Notification');

const getUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20); // Limit to last 20 for now
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ msg: 'Notification not found' });
        }
        res.json(notification);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true }
        );
        res.json({ msg: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

module.exports = { getUserNotifications, markAsRead, markAllAsRead };
