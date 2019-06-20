"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rawstring_1 = require("./rawstring");
/**
 * Render a WireState XState machine config object to JavaScript.
 *
 * @param {Object} machineConfig XState machine config object
 */
exports.render = (machineConfig) => {
    return [
        _head(),
        _body(machineConfig),
        _foot()
    ].join('\n');
};
const _head = () => (`/* Generated on ${new Date().toISOString()} using @launchfort/wirestate */

/* eslint-disable-next-line */
import { Machine, StateNode } from 'xstate'

const DEFAULT_CATCH_FN = (error, actionKey) => {
  console.error({ actionKey, error })
}

/**
* Hooks up actions for all WireState machines and interprets the main application machine.
*
* Where actions are keyed by action keys. Action keys come in two forms:
* - Machine qualified: MachineID/StateID/entry or MachineID/StateID/exit
* - Machine only: MachineID/entry or MachineID/exit
*
* Every \`@use MachineID\` WireState statement results in the state with the
* @use statement having a child state created where the used machine is inserted
* by namespacing all state IDs.
*
* @example
* const machine = wirestate({
*   actions: { 'App/Some Initial State/entry': (event, send) => send('Go') },
*   catchFn: (e, key) => console.error({ actionKey: key, error: e })
* })
* machine.transition(machine.initial, 'go')
* @param { { [key:string]: (event, send: Function, receive: Function) => void|Function } } [actions]
* @param { (error, actionKey) => void } [catchFn] Optional error callback called when an action throws an error
* @return {Object} The XState machine instance
*/
export function wirestate ({ actions = {}, catchFn = DEFAULT_CATCH_FN }) {
  const noaction = () => {}
  // Look up an action (avoids XState throwing if an action is not found)
  const action = actionKey => {
    const axn = actions[actionKey] || noaction
    return (ctx, e) => {
      return (send, receive) => {
        try {
          return axn(e, send, receive)
        } catch(error) {
          catchFn(error, actionKey)
        }
      }
    }
  }
`);
/**
 * @param {Object} machineConfig XState machine config object
 */
const _body = machineConfig => {
    return rawstring_1.unwrap(`  return Machine(${JSON.stringify(machineConfig, null, 2)})`)
        .replace(/\n/g, '\n  ');
};
const _foot = () => `}`;
//# sourceMappingURL=template.js.map