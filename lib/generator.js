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
    let stateIdPrefixCount = 1;
    const rawstring = s => `<!${s}!>`;
    async function toXstateNode(stateNode, { stateIdPrefix = '' } = {}) {
        let xstateNode = {
            id: `${stateIdPrefix}${stateNode.id}`,
            initial: (stateNode.states.find(state => !!state.initial) || { id: undefined }).id,
            final: stateNode.final ? true : undefined,
            type: stateNode.parallel ? 'parallel' : undefined,
            entry: [
                rawstring(`action('${stateNode.machineNode.id}/${stateNode.id}/entry')`),
                rawstring(`action('${stateNode.id}/entry')`)
            ],
            exit: [
                rawstring(`action('${stateNode.machineNode.id}/${stateNode.id}/exit')`),
                rawstring(`action('${stateNode.id}/exit')`)
            ]
        };
        if (stateNode.transitions.length) {
            xstateNode.on = stateNode.transitions.reduce((o, transition) => {
                o[transition.event] = transition.target.split(',').map(s => `#${stateIdPrefix}${s.trim()}`).join(', ');
                return o;
            }, {});
        }
        if (stateNode.states.length) {
            const childXstateNodes = await Promise.all(stateNode.states.map(stateNode => toXstateNode(stateNode, { stateIdPrefix })));
            xstateNode.states = childXstateNodes.reduce((states, childXstateNode, index) => {
                states[stateNode.states[index].id] = childXstateNode;
                return states;
            }, {});
        }
        if (stateNode.useDirective) {
            const stateIdPrefix = `${stateNode.useDirective.machineId}${stateIdPrefixCount++}::`;
            const machineNode = await cache.findMachineById(stateNode.useDirective.machineId);
            const name = stateNode.useDirective.machineId;
            const xstateMachine = await toXstateMachine(machineNode, { stateIdPrefix });
            delete xstateMachine.id;
            xstateNode.initial = name;
            xstateNode.states = {
                [name]: xstateMachine
            };
        }
        return xstateNode;
    }
    async function toXstateMachine(machineNode, { stateIdPrefix = '' } = {}) {
        let xstateMachineNode = {
            context: { children: {} },
            id: `${stateIdPrefix}${machineNode.id}`,
            initial: (machineNode.states.find(state => !!state.initial) || { id: undefined }).id,
            entry: [rawstring(`action('${machineNode.id}/entry')`)],
            exit: [rawstring(`action('${machineNode.id}/exit')`)]
        };
        if (machineNode.transitions.length) {
            xstateMachineNode.on = machineNode.transitions.reduce((o, transition) => {
                o[transition.event] = transition.target.split(',').map(s => `#${stateIdPrefix}${s.trim()}`).join(', ');
                return o;
            }, {});
        }
        if (machineNode.states.length) {
            const childXstateNodes = await Promise.all(machineNode.states.map(stateNode => toXstateNode(stateNode, { stateIdPrefix })));
            xstateMachineNode.states = childXstateNodes.reduce((states, childXstateNode, index) => {
                states[machineNode.states[index].id] = childXstateNode;
                return states;
            }, {});
        }
        return xstateMachineNode;
    }
    async function toXstateConfig() {
        const wireStateFiles = [...cache.keys];
        let machines = await Promise.all(wireStateFiles.map(async (wireStateFile) => {
            const scopeNode = await cache.get(wireStateFile);
            const xstateMachines = await Promise.all(scopeNode.machines.map(m => toXstateMachine(m)));
            const machines = xstateMachines.map(xstateMachineNode => {
                return `machines['${xstateMachineNode.id}'] = Machine(${JSON.stringify(xstateMachineNode, null, 2)})`;
            });
            return machines.join('\n\n');
        }));
        machines = machines.reduce((a, b) => {
            return a.concat(b);
        }, []);
        const output = (
        // eslint-disable-next-line indent
        `
/* Generated on ${new Date().toISOString()} using @launchfort/wirestate */

/* eslint-disable-next-line */
import { assign, spawn, Machine, send, sendParent, SpecialTargets, Interpreter, interpret as xstateInterpret } from 'xstate'

if (!spawn) throw new Error('Please install the latest version of "xstate"')

/**
 * Hooks up actions for all WireState machines and interprets the main application machine.
 *
 * Where actions are keyed by action keys. Action keys come in two forms:
 * - Machine qualified: MachineID/StateID/entry or MachineID/StateID/exit
 * - State qualified: StateID/entry or StateID/exit
 *
 * This way actions can be hooked up to a specific state activation/deactivation
 * or to the general state ID if it's used in several machines.
 *
 * Every \`@use MachineID\` WireState statement results in the state with the
 * @use statement having an entry action that assigns the spawned child actor to
 * the \`children\` object on the context.
 *
 * \`\`\`
 * entry: assign(ctx => ({ children: { ...ctx.children, [StateID]: spawn() } }))
 * \`\`\`
 *
 * @example
 * wirestate({
 *  'main: 'App',
 *   actions: { 'App/Some Initial State/entry': (ctx, event, send) => send('Go') },
 *   catch: (e, key) => console.error({ actionKey: key, error: e })
 * })
 * @param {string} main The ID of the root/main machine
 * @param { { [key:string]: (context, event, send: Function, sendToParent: Function, sendTo: Function) => any } } [actions]
 * @param { (error, actionKey) => void } [catch] Optional error callback called when an action throws an error
 * @param { (machine: StateMachine) => Interpreter } [interpret] The interpreter factory function
 * @return {Interpreter}
 */
export function wirestate ({ main, actions = {}, catch = (error, actionKey) => console.error({ actionKey, error }), interpret = xstateInterpret }) {
  const noaction = () => {}
  // Look up an action (avoids XState throwing if an action is not found)
  const action = actionKey => {
    const axn = actions[actionKey] || noaction
    return (ctx, e) => {
      new Promise(resolve => {
        resolve(axn(ctx, e, send, sendToParent, sendTo))
      }).catch(error => catch(error, id))
    }
  }

  const machines = {}

  ${machines.join('\n\n').replace(/"<!(.+)!>"/g, '$1').replace(/\n/g, '\n  ')}

  const MainMachine = machines[main]
  // eslint-disable-next-line no-template-curly-in-string
  if (!MainMachine) throw new Error(\`Main machine '\${main}' not found\`)

  const interpreter = interpret(MainMachine)
  const send = (event, payload = undefined) => interpreter.send(event, payload)
  const sendTo = (event, to) => interpreter.send(event, to)
  const sendToParent = (event) => sendTo(event, SpecialTargets.Parent)

  return interpreter
}`);
        return output;
    }
    return toXstateConfig();
}
//# sourceMappingURL=generator.js.map