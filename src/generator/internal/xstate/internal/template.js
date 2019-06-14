import { unwrap } from './rawstring'

/**
 * Render the WireState XState machine config objects to JavaScript.
 *
 * @param {Map<string, Object>} machineConfigs Mapping of WireState machine ID to XState machine config objects
 */
export const render = (machineConfigs) => {
  return [
    _head(),
    _body(machineConfigs),
    _foot()
  ].join('\n')
}

const _head = () => (
  `/* Generated on ${new Date().toISOString()} using @launchfort/wirestate */

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
* wirestate({
*   actions: { 'App/Some Initial State/entry': (event, send) => send('Go') },
*   catchFn: (e, key) => console.error({ actionKey: key, error: e })
* })
* @param { { [key:string]: (event, send: Function, receive: Function) => void|Function } } [actions]
* @param { (error, actionKey) => void } [catchFn] Optional error callback called when an action throws an error
* @return {Object} The XState machine config objects keyed by machine ID
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

  const machines = {}
`
)

/**
 * @param {Map<string, Object>} machineConfigs Mapping of WireState machine ID to XState machine config objects
 */
const _body = machineConfigs => {
  let lines = []

  for (let [wireStateMachineId, machineConfig] of machineConfigs) {
    lines.push(
      `machines['${wireStateMachineId}'] = Machine(${JSON.stringify(machineConfig, null, 2)})`
    )
  }

  return unwrap(
    // Indent each line appropriately
    lines.map(line => {
      return '  ' + line.replace(/\n/g, '\n  ')
    }).join('\n\n')
  )
}

const _foot = () => (
  `
  return machines
}`
)