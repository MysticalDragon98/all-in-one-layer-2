const { log, configureLogs } = require('@mysticaldragon/logger');
const { ObjectUtils } = require('@mysticaldragon/utils');
const { resolve } = require('path');

require('dotenv').config({ path: resolve(__dirname, "../.env") });
log("ENV", "Environment loaded.");

const DEBUG_LEVEL = process.argv.includes("--debug") || false;
const FORCE_ACTION = process.argv.includes("--force") || false;
const hiddenLogs = DEBUG_LEVEL? [] : ["LINE", "COMMAND", "ENV", "STORAGE", "ENS-DEBUG"];

configureLogs({ hidden: hiddenLogs.map(_class => ({ class: _class })) });

process.env.FORCE_ACTION = FORCE_ACTION;
module.exports = process.env;