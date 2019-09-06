"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require("path");
const FS = require("fs");
const util_1 = require("util");
const ast_nodes_1 = require("./ast-nodes");
const FileSystem = require("./file-system");
const analyzer_1 = require("./analyzer");
const memory_cache_1 = require("./memory-cache");
const fsReadFile = util_1.promisify(FS.readFile);
const fsWriteFile = util_1.promisify(FS.writeFile);
const fsUnlink = util_1.promisify(FS.unlink);
const fsStat = util_1.promisify(FS.stat);
class FileCache extends memory_cache_1.MemoryCache {
    constructor({ srcDir = '', cacheDir = '.wirestate' } = {}) {
        super();
        this._srcDir = srcDir;
        this._cacheDir = cacheDir;
    }
    get srcDir() { return this._srcDir; }
    get cacheDir() { return this._cacheDir; }
    async set(wireStateFile, promise) {
        super.set(wireStateFile, promise);
        const scopeNode = await promise;
        const text = JSON.stringify(scopeNode, null, 2);
        const fileName = Path.resolve(this.cacheDir, wireStateFile);
        await FileSystem.mkdirp(Path.dirname(fileName));
        await fsWriteFile(fileName, text, 'utf8');
    }
    async has(wireStateFile) {
        const existsInMemory = await super.has(wireStateFile);
        if (existsInMemory)
            return true;
        return this._isInCacheDir(wireStateFile);
    }
    async get(wireStateFile) {
        let scopeNode = await super.get(wireStateFile);
        if (!scopeNode) {
            const isInCacheDir = await this._isInCacheDir(wireStateFile);
            if (isInCacheDir) {
                const promise = this._loadFromCacheDir(wireStateFile);
                super.set(wireStateFile, promise);
                return promise;
            }
        }
        return scopeNode;
    }
    async delete(wireStateFile) {
        const exists = await this.has(wireStateFile);
        if (exists) {
            await super.delete(wireStateFile);
            const file = Path.resolve(this.cacheDir, wireStateFile);
            try {
                await fsUnlink(file);
            }
            catch (error) {
                if (error.code !== 'ENOENT') {
                    throw error;
                }
            }
        }
    }
    async _isInCacheDir(wireStateFile) {
        const cachedFileName = Path.resolve(this.cacheDir, wireStateFile);
        const srcFileName = Path.resolve(this.srcDir, wireStateFile);
        // Load stat for the source file and the cached file
        // If any file does not exist or is not a file then return false
        // If cached file modified time is older than source file return false
        // Otherwise return true
        try {
            const cachedStats = await fsStat(cachedFileName);
            const srcStats = await fsStat(srcFileName);
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
    }
    async _loadFromCacheDir(wireStateFile) {
        const fileName = Path.resolve(this.cacheDir, wireStateFile);
        const text = await fsReadFile(fileName, 'utf8');
        const json = JSON.parse(text);
        const scopeNode = ast_nodes_1.ScopeNode.fromJSON(json);
        await Promise.all(scopeNode.imports.map(async (importNode) => {
            const cacheHit = await this.has(importNode.wireStateFile);
            if (cacheHit)
                return this.get(importNode.wireStateFile);
            return analyzer_1.requireWireStateFile(importNode.wireStateFile, { cache: this, srcDir: this.srcDir });
        }));
        return scopeNode;
    }
}
exports.FileCache = FileCache;
//# sourceMappingURL=file-cache.js.map