const path = require('node:path');

const backendDir = path.resolve(__dirname, '../..');
const uploadsDir = path.resolve(backendDir, process.env.UPLOADS_DIR || 'uploads');

module.exports = { uploadsDir };
