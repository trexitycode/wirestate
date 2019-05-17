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
const ast_nodes_1 = require("../ast-nodes");
const fsReadFile = util_1.promisify(FS.readFile);
const fsWriteFile = util_1.promisify(FS.writeFile);
const fsUnlink = util_1.promisify(FS.unlink);
const fsStat = util_1.promisify(FS.stat);
class Cache {
    constructor({ cacheDir = '.wirestate' } = {}) {
        this._cacheDir = cacheDir;
        /** @type {Map<string, Promise<ScopeNode>>} */
        this._table = new Map();
    }
    get cacheDir() { return this._cacheDir; }
    set(fileName, promise) {
        return __awaiter(this, void 0, void 0, function* () {
            this._table.set(fileName, promise);
            const scopeNode = yield promise;
            const text = JSON.stringify(scopeNode, null, 2);
            const file = Path.resolve(this.cacheDir, fileName);
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
    // async getMachinesFromFile (fileName, machineIds) {
    //   const scopeNode = await this.get(fileName)
    //   const machineNodes = machineIds.map(machineId => {
    //     return scopeNode.machines.find(machineNode => {
    //       return machineNode.id === machineId
    //     })
    //   })
    //   const missingMachineIds = machineNodes.map((machineNode, index) => {
    //     if (!machineNode) {
    //       return machineIds[index]
    //     } else {
    //       return null
    //     }
    //   }).filter(Boolean)
    //   if (missingMachineIds.length) {
    //     throw new Error(`Machines not found in scope\n  File: ${fileName}\n  Machine IDs: ${missingMachineIds}`)
    //   } else {
    //     return machineNodes
    //   }
    // }
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
            yield Promise.all(fileNames.map(fileName => {
                return this.delete(fileName);
            }));
        });
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