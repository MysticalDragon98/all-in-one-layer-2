const { log, configureLogs } = require('@mysticaldragon/logger');
const { ObjectUtils } = require('@mysticaldragon/utils');
const { resolve } = require('path');

require('dotenv').config({ path: resolve(__dirname, "../.env") });
log("ENV", "Environment loaded.");

const DEBUG_LEVEL = process.argv.includes("--debug") || false;
const hiddenLogs = DEBUG_LEVEL? [] : ["LINE", "COMMAND", "ENV", "STORAGE"];

configureLogs({ hidden: hiddenLogs.map(_class => ({ class: _class })) });

module.exports = process.env;