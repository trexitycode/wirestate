"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const to_machine_config_1 = require("./internal/to-machine-config");
const template_1 = require("./internal/template");
/**
 *
 * @param {Cache} cache
 */
async function xstateGenerator(cache, { disableCallbacks = false } = {}) {
    const wireStateFiles = [...cache.keys];
    // Since the Map constructor takes an initializer like: [ [key, value], ... ]
    // we build an array of: [ [WireState machine ID, XState machine config], ... ]
    // array to new up a Map for the render function.
    /** @type {Array<[string, object]>} */
    const machineConfigsMapInitializer = await Promise.all(wireStateFiles.map(async (wireStateFile) => {
        const scopeNode = await cache.get(wireStateFile);
        return Promise.all(scopeNode.machines.map(async (machineNode) => {
            return [
                machineNode.id,
                await to_machine_config_1.toMachineConfig({ machineNode, cache, disableCallbacks })
            ];
        }));
    })).then(_flatten);
    return template_1.render(new Map(machineConfigsMapInitializer));
}
exports.xstateGenerator = xstateGenerator;
/**
 * Flattens an array of arrays.
 *
 * @param {Array<any>[]} array
 * @return {any[]}
 */
function _flatten(array) {
    return array.reduce((a, b) => a.concat(b), []);
}
//# sourceMappingURL=index.js.map