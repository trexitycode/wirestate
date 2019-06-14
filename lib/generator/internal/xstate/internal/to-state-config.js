"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rawstring_1 = require("./rawstring");
const counter_1 = require("./counter");
/**
 * @param {object} [options]
 * @param {StateNode} options.stateNode
 * @param {Cache} options.cache
 * @param {(...args) => any} options.toMachineConfig
 * @param {CountingObject} [options.counter]
 * @param {boolean} [options.disableActions]
 */
async function toStateConfig({ stateNode, cache, toMachineConfig, counter = null, disableActions = false }) {
    const machineNode = stateNode.machineNode;
    /**
     * Transforms a state ID into a qualified state ID for XState
     *
     * @param {string} id The state ID to transform
     */
    const ID = id => {
        return counter
            ? `${machineNode.id} ${id} ${counter.value}`
            : id;
    };
    let stateConfig = {
        id: ID(stateNode.id),
        final: stateNode.final ? true : undefined,
        type: stateNode.parallel ? 'parallel' : undefined
    };
    if (!disableActions) {
        stateConfig.invoke = {
            src: rawstring_1.rawstring(`action('${stateNode.machineNode.id}/${stateNode.id}')`)
        };
    }
    const initialStateNode = stateNode.states.find(state => !!state.initial);
    if (initialStateNode) {
        stateConfig.initial = initialStateNode.id;
    }
    if (stateNode.transitions.length) {
        stateConfig.on = stateNode.transitions.reduce((o, transition) => {
            o[transition.event] = transition.target.split(',').map(s => {
                return `#${ID(s.trim())}`;
            }).join(', ');
            return o;
        }, {});
    }
    if (stateNode.states.length) {
        const childXstateNodes = await Promise.all(stateNode.states.map(stateNode => {
            return toStateConfig({ stateNode, cache, toMachineConfig, counter, disableActions });
        }));
        stateConfig.states = childXstateNodes.reduce((states, childXstateNode, index) => {
            states[stateNode.states[index].id] = childXstateNode;
            return states;
        }, {});
    }
    if (stateNode.useDirective) {
        const machineNode = await cache.findMachineById(stateNode.useDirective.machineId);
        const name = stateNode.useDirective.machineId;
        const machineCounter = counter_1.Counter.get(machineNode.id);
        machineCounter.incr();
        const machineConfig = await toMachineConfig({ machineNode, cache, disableActions, counter: machineCounter });
        delete machineConfig.id;
        stateConfig.initial = name;
        stateConfig.states = {
            [name]: machineConfig
        };
    }
    return stateConfig;
}
exports.toStateConfig = toStateConfig;
//# sourceMappingURL=to-state-config.js.map