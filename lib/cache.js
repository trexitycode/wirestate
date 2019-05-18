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
const Path = require("path");
const FS = require("fs");
const util_1 = require("util");
const Mkdirp = require("mkdirp");
const ast_nodes_1 = require("./ast-nodes");
const fsReadFile = util_1.promisify(FS.readFile);
const fsWriteFile = util_1.promisify(FS.writeFile);
const fsUnlink = util_1.promisify(FS.unlink);
const fsStat = util_1.promisify(FS.stat);
const mkdirp = util_1.promisify(Mkdirp);
class Cache {
    constructor({ cacheDir = '.wirestate' } = {}) {
        this._cacheDir = cacheDir;
        // Table used to prevent multiple file load calls from occuring
        // i.e. if we save a promise then the get() method returns this promise
        /** @type {Map<string, Promise<ScopeNode>>} */
        this._table = new Map();
        // Additional table used for JSON serialization
        /** @type {Map<string, ScopeNode>} */
        this._scopes = new Map();
    }
    get cacheDir() { return this._cacheDir; }
    get keys() {
        return this._table.keys();
    }
    set(fileName, promise) {
        return __awaiter(this, void 0, void 0, function* () {
            this._table.set(fileName, promise);
            const scopeNode = yield promise;
            const text = JSON.stringify(scopeNode, null, 2);
            const file = Path.resolve(this.cacheDir, fileName);
            this._scopes.set(fileName, scopeNode);
            yield mkdirp(Path.dirname(file));
            yield fsWriteFile(file, text, 'utf8');
        });
    }
    has(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._isInTable(fileName))
                return true;
            return this._isInCacheDir(fileName);
        });
    }
    get(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._isInTable(fileName)) {
                return this._loadFromTable(fileName);
            }
            else {
                const isInCacheDir = yield this._isInCacheDir(fileName);
                if (isInCacheDir) {
                    const promise = this._loadFromCacheDir(fileName);
                    this.set(fileName, promise);
                    return promise;
                }
                else {
                    return null;
                }
            }
        });
    }
    delete(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._isInTable(fileName)) {
                this._table.delete(fileName);
                this._scopes.delete(fileName);
                const file = Path.resolve(this.cacheDir, fileName);
                try {
                    yield fsUnlink(file);
                }
                catch (error) {
                    if (error.code !== 'ENOENT') {
                        throw error;
                    }
                }
            }
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            const fileNames = [...this._table.keys()];
            this._table.clear();
            this._scopes.clear();
            yield Promise.all(fileNames.map(fileName => {
                return this.delete(fileName);
            }));
        });
    }
    toJSON() {
        let json = {};
        for (let fileName of this._scopes.keys()) {
            json[fileName] = this._scopes.get(fileName);
        }
        return json;
    }
    _isInTable(fileName) {
        return this._table.has(fileName);
    }
    _isInCacheDir(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = Path.resolve(this.cacheDir, fileName);
            try {
                const stats = yield fsStat(file);
                return stats.isFile();
            }
            catch (error) {
                if (error.code === 'ENOENT') {
                    return false;
                }
                else {
                    throw error;
                }
            }
        });
    }
    _loadFromTable(fileName) {
        return this._table.get(fileName);
    }
    _loadFromCacheDir(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = Path.resolve(this.cacheDir, fileName);
            const text = yield fsReadFile(file, 'utf8');
            const json = JSON.parse(text);
            return ast_nodes_1.ScopeNode.fromJSON(json);
        });
    }
}
exports.Cache = Cache;
//# sourceMappingURL=cache.js.map