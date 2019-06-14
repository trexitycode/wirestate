"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_generator_1 = require("./internal/json-generator");
const xstate_1 = require("./internal/xstate");
function makeGenerator() {
    /**
     * @param {Cache} cache
     * @param {Object} [options]
     * @param {string} [options.generatorName]
     * @return {Promise<string>}
     */
    const generate = async (cache, { generatorName = 'json' } = {}) => {
        if (!generatorName) {
            throw new Error('Generator name must be provided');
        }
        if (generatorName === 'json')
            return json_generator_1.jsonGenerator(cache);
        if (generatorName === 'xstate')
            return xstate_1.xstateGenerator(cache);
        throw new Error(`Generator "${generatorName}" not found`);
    };
    return { generate };
}
exports.makeGenerator = makeGenerator;
//# sourceMappingURL=index.js.map