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
const tokenizer_1 = require("./tokenizer");
const parser_1 = require("./parser");
const analyzer_1 = require("./analyzer");
const generator_1 = require("./generator");
const cache_1 = require("./cache");
/**
 * @param {string} text
 * @param {string} wireStateFile
 * @param {Object} [options]
 * @param {string} [options.srcDir]
 * @param {string} [options.cacheDir]
 * @param {string} [options.generatorName]
 */
exports.compileFromText = (text, wireStateFile, { srcDir = '', cacheDir = '.wirestate', generatorName = 'json' } = {}) => __awaiter(this, void 0, void 0, function* () {
    if (Path.isAbsolute(wireStateFile)) {
        throw new Error('WireStateFile must be relative');
    }
    if (wireStateFile.startsWith('.')) {
        throw new Error('WireStateFile cannot be prefixed with ./ or ../');
    }
    // Ensure the file we're compiling has an extension,
    // by default it's the .wirestate extension
    wireStateFile = Path.extname(wireStateFile)
        ? wireStateFile
        : `${wireStateFile}.wirestate`;
    const cache = new cache_1.Cache({ srcDir, cacheDir });
    const tokenizer = tokenizer_1.makeTokenizer({ wireStateFile });
    const parser = parser_1.makeParser({ wireStateFile });
    const analyzer = analyzer_1.makeAnalyzer({ cache, srcDir });
    const generator = generator_1.makeGenerator();
    const tokens = tokenizer.tokenize(text);
    let scopeNode = parser.parse(tokens);
    scopeNode = yield analyzer.analyze(scopeNode);
    yield cache.set(wireStateFile, Promise.resolve(scopeNode));
    return generator.generate(cache, { generatorName });
});
/**
 * @param {string} fileName
 * @param {Object} [options]
 * @param {string} [options.srcDir]
 * @param {string} [options.cacheDir]
 * @param {string} [options.generatorName]
 */
exports.compile = (fileName, { srcDir = '', cacheDir = '.wirestate', generatorName = 'json' } = {}) => __awaiter(this, void 0, void 0, function* () {
    const cache = new cache_1.Cache({ srcDir, cacheDir });
    let wireStateFile = Path.relative(Path.resolve(srcDir), Path.resolve(fileName));
    if (wireStateFile.startsWith('.')) {
        throw new Error('File must be located in the srcDir');
    }
    // Ensure the file we're compiling has an extension,
    // by default it's the .wirestate extension
    wireStateFile = Path.extname(wireStateFile)
        ? wireStateFile
        : `${wireStateFile}.wirestate`;
    const cacheHit = yield cache.has(wireStateFile);
    if (cacheHit) {
        yield cache.get(wireStateFile);
    }
    else {
        yield analyzer_1.requireWireStateFile(wireStateFile, { cache, srcDir });
    }
    const generator = generator_1.makeGenerator();
    return generator.generate(cache, { generatorName });
});
//# sourceMappingURL=compile.js.map