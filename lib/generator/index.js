"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xstate_1 = require("./internal/xstate");
function makeGenerator() {
    /**
     * @param {MachineNode} mainMachineNode
     * @param {Cache} cache
     * @param {Object} [options]
     * @param {string} [options.generatorName]
     * @param {boolean} [options.disableActions] Flag when generating XState to disable action mapping
     * @return {Promise<string>}
     */
    const generate = async (mainMachineNode, cache, { disableActions = false } = {}) => {
        return xstate_1.xstateGenerator(mainMachineNode, cache, { disableActions });
    };
    return { generate };
}
exports.makeGenerator = makeGenerator;
//# sourceMappingURL=index.js.map