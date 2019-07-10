"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rawstring_1 = require("./rawstring");
const to_state_config_1 = require("./to-state-config");
/**
 * @param {object} [options]
 * @param {MachineNode} options.machineNode
 * @param {Cache} options.cache
 * @param {CountingObject} [options.counter]
 * @param {boolean} [options.disableActions]
 */
async function toMachineConfig({ machineNode, cache, counter = null, disableActions = false }) {
    /**
     * Transforms a state ID into a qualified state ID for XState
     *
     * @param {string} id The state ID to transform
     */
    const ID = id => {
        return counter
            ? `${id} ${counter.value}`
            : id;
    };
    let machineConfig = {
        id: ID(machineNode.id),
        initial: (machineNode.states.find(state => !!state.initial) || { id: undefined }).id
    };
    if (!disableActions) {
        machineConfig.invoke = { src: rawstring_1.rawstring(`callback('${machineNode.id}')`) };
    }
    const initialStateNode = machineNode.states.find(state => !!state.initial);
    if (initialStateNode) {
        machineConfig.initial = initialStateNode.id;
    }
    if (machineNode.transitions.length) {
        machineConfig.on = machineNode.transitions.reduce((o, transition) => {
            o[transition.event] = transition.target.split(',').map(s => {
                return `#${ID(s.trim())}`;
            }).join(', ');
            return o;
        }, {});
    }
    if (machineNode.states.length) {
        const childStateConfigs = await Promise.all(machineNode.states.map(stateNode => {
            return to_state_config_1.toStateConfig({ stateNode, cache, toMachineConfig, counter, disableActions });
        }));
        machineConfig.states = childStateConfigs.reduce((states, childStateConfig, index) => {
            states[machineNode.states[index].id] = childStateConfig;
            return states;
        }, {});
    }
    return machineConfig;
}
exports.toMachineConfig = toMachineConfig;
//# sourceMappingURL=to-machine-config.js.map