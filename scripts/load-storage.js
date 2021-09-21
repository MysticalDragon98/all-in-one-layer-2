
const { log } = require('@mysticaldragon/logger');
const { Storage } = require('@mysticaldragon/storage');
const { resolve } = require('path');
const dataStorage = new Storage({ dir: resolve(__dirname, "../data") });

const cachedStorages = {};
const path = exports.path = dataStorage.path.bind(dataStorage);
const mkdir = exports.mkdir = dataStorage.mkdir.bind(dataStorage);
const json = exports.json = (name) => {
    if (cachedStorages[name]) return cachedStorages[name];
    cachedStorages[name] = dataStorage.json[name];
    
    return cachedStorages[name]
}

let Flags;
exports.initStorage = async (dirs = []) => {
    log("STORAGE", "Initializing storage...");
    await dataStorage.init();

    for (const dir of dirs) this.mkdir(dir);
    Flags = json('flags');
}

exports.flag = (name, enable) => {
    if (enable === undefined) return Flags[name];
    
    return Flags[name] = enable? 1 : 0;
}

exports.Storage = dataStorage;