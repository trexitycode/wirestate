"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rawstring_1 = require("./rawstring");
/**
 * Render the WireState XState machine config objects to JavaScript.
 *
 * @param {Map<string, Object>} machineConfigs Mapping of WireState machine ID to XState machine config objects
 */
exports.render = (machineConfigs) => {
    return [
        _head(),
        _body(machineConfigs),
        _foot()
    ].join('\n');
};
const _head = () => (`/* Generated on ${new Date().toISOString()} using @launchfort/wirestate */
/* eslint-disable */

import { Machine, StateNode } from 'xstate'

const DEFAULT_CATCH_FN = (error, callbackKey) => {
  console.error({ callbackKey, error })
}

/**
* Hooks up callbacks for all WireState machines and interprets the main application machine.
*
* Where callbacks are keyed by callback keys. Callback keys come in two forms:
* - Machine qualified: MachineID/StateID/entry or MachineID/StateID/exit
* - Machine only: MachineID/entry or MachineID/exit
*
* Every \`@use MachineID\` WireState statement results in the state with the
* @use statement having a child state created where the used machine is inserted
* by namespacing all state IDs.
*
* @example
* wirestate({
*   callbacks: { 'App/Some Initial State/entry': (event, send) => send('Go') },
*   catchFn: (e, key) => console.error({ callbackKey: key, error: e })
* })
* @param { { [key:string]: (event, send: Function, receive: Function) => void|Function } } [callbacks]
* @param { (error, callbackKey) => void } [catchFn] Optional error callback called when an callback throws an error
* @return {Object} The XState machine config objects keyed by machine ID
*/
export function wirestate ({ callbacks = {}, catchFn = DEFAULT_CATCH_FN }) {
  const noaction = () => {}
  // Look up a callback (avoids XState throwing if a callback service is not found)
  const callback = callbackKey => {
    const cb = callbacks[callbackKey] || noaction
    return (ctx, e) => {
      return (send, receive) => {
        try {
          return cb(e, send, receive)
        } catch (error) {
          catchFn(error, callbackKey)
        }
      }
    }
  }

  const machines = {}
`);
/**
 * @param {Map<string, Object>} machineConfigs Mapping of WireState machine ID to XState machine config objects
 */
const _body = machineConfigs => {
    const lines = [];
    for (const [wireStateMachineId, machineConfig] of machineConfigs) {
        lines.push(`machines['${wireStateMachineId}'] = Machine(${JSON.stringify(machineConfig, null, 2)})`);
    }
    return rawstring_1.unwrap(
    // Indent each line appropriately
    lines.map(line => {
        return '  ' + line.replace(/\n/g, '\n  ');
    }).join('\n\n'));
};
const _foot = () => (`
  return machines
}`);
//# sourceMappingURL=template.js.map