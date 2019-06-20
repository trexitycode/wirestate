"use strict";
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
 * @param {boolean} [options.disableActions] Flag when generating XState to disable action mapping
 * @param {string} [options.mainMachine] The ID of the machine to compile (defaults to the first machine)
 * @return {Promise<string>}
 */
exports.compileFromText = async (text, wireStateFile, { srcDir = '', cacheDir = '.wirestate', disableActions = false, mainMachine = '' } = {}) => {
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
    scopeNode = await analyzer.analyze(scopeNode);
    await cache.set(wireStateFile, Promise.resolve(scopeNode));
    let mainMachineNode = null;
    if (mainMachine) {
        mainMachineNode = await cache.findMachineById(mainMachine);
        if (!mainMachineNode) {
            throw new Error(`Main machine ${mainMachine} not found`);
        }
    }
    else {
        const scopeNode = await cache.get(wireStateFile);
        mainMachineNode = scopeNode.machines[0];
    }
    return generator.generate(mainMachineNode, cache, { disableActions });
};
/**
 * @param {string} fileName
 * @param {Object} [options]
 * @param {string} [options.srcDir]
 * @param {string} [options.cacheDir]
 * @param {string} [options.generatorName]
 * @param {boolean} [options.disableActions] Flag when generating XState to disable action mapping
 * @param {string} [options.mainMachine] The ID of the machine to compile (defaults to the first machine)
 * @return {Promise<string>}
 */
exports.compile = async (fileName, { srcDir = '', cacheDir = '.wirestate', generatorName = 'xstate', disableActions = false, mainMachine = '' } = {}) => {
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
    await analyzer_1.requireWireStateFile(wireStateFile, { cache, srcDir });
    let mainMachineNode = null;
    if (mainMachine) {
        const mainMachineNode = await cache.findMachineById(mainMachine);
        if (!mainMachineNode) {
            throw new Error(`Main machine ${mainMachine} not found`);
        }
    }
    else {
        const scopeNode = await cache.get(wireStateFile);
        mainMachineNode = scopeNode.machines[0];
    }
    const generator = generator_1.makeGenerator();
    return generator.generate(mainMachineNode, cache, { generatorName, disableActions });
};
//# sourceMappingURL=compile.js.map