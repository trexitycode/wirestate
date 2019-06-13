/* eslint-disable-next-line */
import { Cache } from './cache'

export function makeGenerator () {
  /**
   * @param {Cache} cache
   * @param {Object} [options]
   * @param {string} [options.generatorName]
   */
  const generate = (cache, { generatorName = 'json' } = {}) => {
    if (!generatorName) {
      throw new Error('Generator name must be provided')
    }

    if (generatorName === 'json') return jsonGenerator(cache)
    if (generatorName === 'json-commonjs') return jsonCommonJsGenerator(cache)
    if (generatorName === 'json-esm') return jsonEsmGenerator(cache)
    if (generatorName === 'xstate') return xstateConfigGenerator(cache)

    throw new Error(`Generator "${generatorName}" not found`)
  }
  return { generate }
}

/** @param {Cache} cache */
function jsonGenerator (cache) {
  const blacklistedProps = [ 'line', 'column', 'indent' ]
  return JSON.stringify(cache, (key, value) => {
    if (blacklistedProps.includes(key)) return undefined
    return value
  }, 2)
}

/** @param {Cache} cache */
function jsonCommonJsGenerator (cache) {
  return [
    'exports.statechart = ', jsonGenerator(cache)
  ].join('')
}

/** @param {Cache} cache */
function jsonEsmGenerator (cache) {
  return [
    'export const statechart = ', jsonGenerator(cache)
  ].join('')
}

/** @param {Cache} cache */
async function xstateConfigGenerator (cache) {
  let xstateStateIdPrefixCount = 1
  const rawstring = s => `<!${s}!>`
  async function toXstateNode (stateNode, { xstateStateIdPrefix = '' } = {}) {
    let xstateNode = {
      id: `${xstateStateIdPrefix}${stateNode.id}`,
      initial: (stateNode.states.find(state => !!state.initial) || { id: undefined }).id,
      final: stateNode.final ? true : undefined,
      type: stateNode.parallel ? 'parallel' : undefined,
      invoke: { src: rawstring(`action('${stateNode.machineNode.id}/${stateNode.id}')`) }
    }

    if (stateNode.transitions.length) {
      xstateNode.on = stateNode.transitions.reduce((o, transition) => {
        o[transition.event] = transition.target.split(',').map(s => `#${xstateStateIdPrefix}${s.trim()}`).join(', ')
        return o
      }, {})
    }

    if (stateNode.states.length) {
      const childXstateNodes = await Promise.all(stateNode.states.map(stateNode => toXstateNode(stateNode, { xstateStateIdPrefix })))
      xstateNode.states = childXstateNodes.reduce((states, childXstateNode, index) => {
        states[stateNode.states[index].id] = childXstateNode
        return states
      }, {})
    }

    if (stateNode.useDirective) {
      const xstateStateIdPrefix = `${stateNode.useDirective.machineId}${xstateStateIdPrefixCount++}::`
      const machineNode = await cache.findMachineById(stateNode.useDirective.machineId)
      const name = stateNode.useDirective.machineId
      const xstateMachine = await toXstateMachine(machineNode, { xstateStateIdPrefix })

      delete xstateMachine.id

      xstateNode.initial = name
      xstateNode.states = {
        [name]: xstateMachine
      }
    }

    return xstateNode
  }

  async function toXstateMachine (machineNode, { xstateStateIdPrefix = '' } = {}) {
    let xstateMachineNode = {
      context: { children: {} },
      id: `${xstateStateIdPrefix}${machineNode.id}`,
      initial: (machineNode.states.find(state => !!state.initial) || { id: undefined }).id,
      invoke: { src: rawstring(`action('${machineNode.id}')`) }
    }

    if (machineNode.transitions.length) {
      xstateMachineNode.on = machineNode.transitions.reduce((o, transition) => {
        o[transition.event] = transition.target.split(',').map(s => `#${xstateStateIdPrefix}${s.trim()}`).join(', ')
        return o
      }, {})
    }

    if (machineNode.states.length) {
      const childXstateNodes = await Promise.all(machineNode.states.map(stateNode => toXstateNode(stateNode, { xstateStateIdPrefix })))
      xstateMachineNode.states = childXstateNodes.reduce((states, childXstateNode, index) => {
        states[machineNode.states[index].id] = childXstateNode
        return states
      }, {})
    }

    return xstateMachineNode
  }

  async function toXstateConfig () {
    const wireStateFiles = [ ...cache.keys ]
    let machines = await Promise.all(
      wireStateFiles.map(async wireStateFile => {
        const scopeNode = await cache.get(wireStateFile)
        const xstateMachines = await Promise.all(scopeNode.machines.map(m => toXstateMachine(m)))
        const machines = xstateMachines.map(xstateMachineNode => {
          return `machines['${xstateMachineNode.id}'] = Machine(${JSON.stringify(xstateMachineNode, null, 2)})`
        })
        return machines.join('\n\n')
      })
    )
    machines = machines.reduce((a, b) => {
      return a.concat(b)
    }, [])

    const output = (
      // eslint-disable-next-line indent
`
/* Generated on ${new Date().toISOString()} using @launchfort/wirestate */

/* eslint-disable-next-line */
import { Machine, send, StateNode } from 'xstate'

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
 * @param { { [key:string]: (event, send: Function) => any } } [actions]
 * @param { (error, actionKey) => void } [catchFn] Optional error callback called when an action throws an error
 * @return {{ [id: string]: StateNode }} The state machine nodes
 */
export function wirestate ({ actions = {}, catchFn = (error, actionKey) => console.error({ actionKey, error }) }) {
  const noaction = () => {}
  // Look up an action (avoids XState throwing if an action is not found)
  const action = actionKey => {
    const axn = actions[actionKey] || noaction
    return (ctx, e) => {
      return (send, receive) => {
        new Promise(resolve => {
          resolve(axn(e, send, receive))
        }).catch(error => catchFn(error, actionKey))
      }
    }
  }

  const machines = {}

  ${machines.join('\n\n').replace(/"<!(.+)!>"/g, '$1').replace(/\n/g, '\n  ')}

  return machines
}`
    )

    return output
  }

  return toXstateConfig()
}
