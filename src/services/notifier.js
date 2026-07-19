const Notification = require('../models/Notification');

async function notify({ type, message, severity = 'teal', relatedId = null }) {
  return Notification.create({ type, message, severity, relatedId });
}

module.exports = { notify };
