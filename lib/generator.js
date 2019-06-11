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
        if (generatorName === 'xstate')
            return xstateConfigGenerator(cache);
        throw new Error(`Generator "${generatorName}" not found`);
    };
    return { generate };
}
exports.makeGenerator = makeGenerator;
/** @param {Cache} cache */
function jsonGenerator(cache) {
    const blacklistedProps = ['line', 'column', 'indent'];
    return JSON.stringify(cache, (key, value) => {
        if (blacklistedProps.includes(key))
            return undefined;
        return value;
    }, 2);
}
/** @param {Cache} cache */
function jsonCommonJsGenerator(cache) {
    return [
        'exports.statechart = ', jsonGenerator(cache)
    ].join('');
}
/** @param {Cache} cache */
function jsonEsmGenerator(cache) {
    return [
        'export const statechart = ', jsonGenerator(cache)
    ].join('');
}
/** @param {Cache} cache */
async function xstateConfigGenerator(cache) {
    const rawstring = s => `<!${s}!>`;
    const toXstateNode = stateNode => {
        let xstateNode = {
            id: stateNode.id,
            initial: (stateNode.states.find(state => !!state.initial) || { id: undefined }).id,
            final: stateNode.final ? true : undefined,
            type: stateNode.parallel ? 'parallel' : undefined
        };
        if (stateNode.transitions.length) {
            xstateNode.on = stateNode.transitions.reduce((o, transition) => {
                o[transition.event] = transition.target.split(',').map(s => `#${s.trim()}`).join(', ');
                return o;
            }, {});
        }
        if (stateNode.states.length) {
            xstateNode.states = stateNode.states.reduce((states, stateNode) => {
                states[stateNode.id] = toXstateNode(stateNode);
                return states;
            }, {});
        }
        if (stateNode.useDirective) {
            xstateNode.entry = {
                actions: rawstring(`assign({ child: spawn(Machines['${stateNode.useDirective.machineId}']) })`)
            };
        }
        return xstateNode;
    };
    function toXstateMachine(machineNode) {
        let xstateMachineNode = {
            id: machineNode.id,
            initial: (machineNode.states.find(state => !!state.initial) || { id: undefined }).id
        };
        if (machineNode.transitions.length) {
            xstateMachineNode.on = machineNode.transitions.reduce((o, transition) => {
                o[transition.event] = transition.target.split(',').map(s => `#${s.trim()}`).join(', ');
                return o;
            }, {});
        }
        if (machineNode.states.length) {
            xstateMachineNode.states = machineNode.states.reduce((states, stateNode) => {
                states[stateNode.id] = toXstateNode(stateNode);
                return states;
            }, {});
        }
        return xstateMachineNode;
    }
    async function toXstateConfig() {
        const wireStateFiles = [...cache.keys];
        let machines = await Promise.all(wireStateFiles.map(async (wireStateFile) => {
            const scopeNode = await cache.get(wireStateFile);
            const machines = scopeNode.machines.map(toXstateMachine).map(xstateMachineNode => {
                return `Machines['${xstateMachineNode.id}'] = ${JSON.stringify(xstateMachineNode, null, 2)}`;
            });
            return machines.join('\n\n');
        }));
        machines = machines.reduce((a, b) => {
            return a.concat(b);
        }, []);
        return [
            'import { assign, spawn } from \'xstate\'\n',
            'export const Machines = {}\n',
            machines.join('\n\n').replace(/<!(.+)!>/g, '$1')
        ].join('\n');
    }
    return toXstateConfig();
}
//# sourceMappingURL=generator.js.map