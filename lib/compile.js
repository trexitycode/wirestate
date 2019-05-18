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
const analyzer_1 = require("./analyzer");
const generator_1 = require("./generator");
const cache_1 = require("./cache");
exports.compile = (fileName, { dir = '', cacheDir = '.wirestate', generatorName = 'json' } = {}) => __awaiter(this, void 0, void 0, function* () {
    const cache = new cache_1.Cache({ cacheDir });
    const wireStateFile = Path.relative(Path.resolve(dir), Path.resolve(fileName));
    const cacheHit = yield cache.has(wireStateFile);
    let scopeNode = null;
    if (cacheHit) {
        scopeNode = yield cache.get(wireStateFile);
    }
    else {
        scopeNode = yield analyzer_1.requireWireStateFile(wireStateFile, { cache, dirs: [dir] });
    }
    const analyzer = analyzer_1.makeAnalyzer({ cache, dirs: [dir] });
    yield analyzer.analyze(scopeNode);
    const generator = generator_1.makeGenerator();
    return generator.generate(cache, { generatorName });
});
//# sourceMappingURL=compile.js.map