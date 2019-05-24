"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FS = require("fs");
const Mkdirp = require("mkdirp");
const util_1 = require("util");
const _fsStat = util_1.promisify(FS.stat);
const _mkdirp = util_1.promisify(Mkdirp);
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
function mkdirp(dirName) {
    return _mkdirp(dirName);
}
exports.mkdirp = mkdirp;
//# sourceMappingURL=index.js.map