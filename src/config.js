const path = require('path');
const os = require('os');

const config = {
  port: parseInt(process.env.PORT) || 3000,
  tempDir: process.env.TEMP_DIR || path.join(os.tmpdir(), 'xtec-submissions'),
};

module.exports = config;
