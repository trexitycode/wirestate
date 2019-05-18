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
const ast_nodes_1 = require("./ast-nodes");
const FileSystem = require("./file-system");
const analyzer_1 = require("./analyzer");
const fsReadFile = util_1.promisify(FS.readFile);
const fsWriteFile = util_1.promisify(FS.writeFile);
const fsUnlink = util_1.promisify(FS.unlink);
const fsStat = util_1.promisify(FS.stat);
class Cache {
    constructor({ srcDir = '', cacheDir = '.wirestate' } = {}) {
        this._srcDir = srcDir;
        this._cacheDir = cacheDir;
        // Table used to prevent multiple file load calls from occuring
        // i.e. if we save a promise then the get() method returns this promise
        /** @type {Map<string, Promise<ScopeNode>>} */
        this._table = new Map();
        // Additional table used for JSON serialization
        /** @type {Map<string, ScopeNode>} */
        this._scopes = new Map();
    }
    get srcDir() { return this._srcDir; }
    get cacheDir() { return this._cacheDir; }
    get keys() { return this._table.keys(); }
    set(wireStateFile, promise) {
        return __awaiter(this, void 0, void 0, function* () {
            this._table.set(wireStateFile, promise);
            const scopeNode = yield promise;
            const text = JSON.stringify(scopeNode, null, 2);
            const fileName = Path.resolve(this.cacheDir, wireStateFile);
            this._scopes.set(wireStateFile, scopeNode);
            yield FileSystem.mkdirp(Path.dirname(fileName));
            yield fsWriteFile(fileName, text, 'utf8');
        });
    }
    has(wireStateFile) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._isInTable(wireStateFile))
                return true;
            return this._isInCacheDir(wireStateFile);
        });
    }
    get(wireStateFile) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._isInTable(wireStateFile)) {
                return this._loadFromTable(wireStateFile);
            }
            else {
                const isInCacheDir = yield this._isInCacheDir(wireStateFile);
                if (isInCacheDir) {
                    const promise = this._loadFromCacheDir(wireStateFile);
                    this.set(wireStateFile, promise);
                    return promise;
                }
                else {
                    return null;
                }
            }
        });
    }
    delete(wireStateFile) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._isInTable(wireStateFile)) {
                this._table.delete(wireStateFile);
                this._scopes.delete(wireStateFile);
                const file = Path.resolve(this.cacheDir, wireStateFile);
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
        for (let wireStateFile of this._scopes.keys()) {
            json[wireStateFile] = this._scopes.get(wireStateFile);
        }
        return json;
    }
    _isInTable(wireStateFile) {
        return this._table.has(wireStateFile);
    }
    _isInCacheDir(wireStateFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedFileName = Path.resolve(this.cacheDir, wireStateFile);
            const srcFileName = Path.resolve(this.srcDir, wireStateFile);
            // Load stat for the source file and the cached file
            // If any file does not exist or is not a file then return false
            // If cached file modified time is older than source file return false
            // Otherwise return true
            try {
                const cachedStats = yield fsStat(cachedFileName);
                const srcStats = yield fsStat(srcFileName);
                if (cachedStats.isFile() && srcStats.isFile()) {
                    return cachedStats.mtimeMs >= srcStats.mtimeMs;
                }
                else {
                    return false;
                }
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
    _loadFromTable(wireStateFile) {
        return this._table.get(wireStateFile);
    }
    _loadFromCacheDir(wireStateFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileName = Path.resolve(this.cacheDir, wireStateFile);
            const text = yield fsReadFile(fileName, 'utf8');
            const json = JSON.parse(text);
            const scopeNode = ast_nodes_1.ScopeNode.fromJSON(json);
            yield Promise.all(scopeNode.imports.map((importNode) => __awaiter(this, void 0, void 0, function* () {
                const cacheHit = yield this.has(importNode.wireStateFile);
                if (cacheHit)
                    return this.get(importNode.wireStateFile);
                return analyzer_1.requireWireStateFile(importNode.wireStateFile, { cache: this, srcDir: this.srcDir });
            })));
            return scopeNode;
        });
    }
}
exports.Cache = Cache;
//# sourceMappingURL=cache.js.map