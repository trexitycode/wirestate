"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function makeGenerator() {
    /**
     * @param {Cache} cache
     * @param {Object} [options]
     * @param {string} [options.generatorName]
     */
    const generate = (cache, { generatorName = 'json' } = {}) => {
        if (!generatorName) {
            throw new Error('Generator name must be provided');
        }
        if (generatorName === 'json')
            return jsonGenerator(cache);
        if (generatorName === 'json-commonjs')
            return jsonCommonJsGenerator(cache);
        if (generatorName === 'json-esm')
            return jsonEsmGenerator(cache);
        throw new Error(`Generator "${generatorName}" not found`);
    };
    return { generate };
}
exports.makeGenerator = makeGenerator;
/** @param {Cache} cache */
function jsonGenerator(cache) {
    return JSON.stringify(cache, null, 2);
}
/** @param {Cache} cache */
function jsonCommonJsGenerator(cache) {
    return [
        'exports.config = ', jsonGenerator(cache)
    ].join('');
}
/** @param {Cache} cache */
function jsonEsmGenerator(cache) {
    return [
        'export const config = ', jsonGenerator(cache)
    ].join('');
}
//# sourceMappingURL=generator.js.map