"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FS = require("fs");
const Path = require("path");
const util_1 = require("util");
const _fsStat = util_1.promisify(FS.stat);
const _mkdir = util_1.promisify(FS.mkdir);
/**
 * @param {string} fileName
 * @return {Promise<boolean>}
 */
async function fileExists(fileName) {
    try {
        const stats = await _fsStat(fileName);
        return stats.isFile();
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return false;
        throw error;
    }
}
exports.fileExists = fileExists;
/**
 * @param {string} dirName
 * @return {Promise<void>}
 */
async function mkdirp(dirName) {
    try {
        await _mkdir(dirName, { recursive: true });
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            await mkdirp(Path.dirname(dirName));
            await _mkdir(dirName);
        }
        else {
            throw error;
        }
    }
}
exports.mkdirp = mkdirp;
//# sourceMappingURL=index.js.map