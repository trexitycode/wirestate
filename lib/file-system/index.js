"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
function fileExists(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stats = yield _fsStat(fileName);
            return stats.isFile();
        }
        catch (error) {
            if (error.code === 'ENOENT')
                return false;
            throw error;
        }
    });
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