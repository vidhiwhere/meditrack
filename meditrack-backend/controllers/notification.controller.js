const notificationService = require('../services/notification/notification.service');
const logger = require('../utils/logger');

module.exports = {
  sendDirectMessage: async (req, res) => {
    try {
      const { userId, message, type } = req.body;
      if (!userId || !message) return res.status(400).json({ error: 'userId and message required' });
      
      const result = await notificationService.sendNotification(userId, message, type || 'sms');
      res.json(result);
    } catch (error) {
      logger.error('Error sending notification', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }
};
