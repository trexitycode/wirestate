/* eslint-disable no-unused-vars */
import { StateNode } from '../../../../ast-nodes'
import { CacheBase } from '../../../../cache-base'
import { rawstring } from './rawstring'
import { Counter, CountingObject } from './counter'

/**
 * @param {object} [options]
 * @param {StateNode} options.stateNode
 * @param {CacheBase} options.cache
 * @param {(...args) => any} options.toMachineConfig
 * @param {CountingObject} [options.counter]
 * @param {boolean} [options.disableCallbacks]
 */
export async function toStateConfig ({ stateNode, cache, toMachineConfig, counter = null, disableCallbacks = false }) {
  const machineNode = stateNode.machineNode
  /**
   * Transforms a state ID into a qualified state ID for XState
   *
   * @param {string} id The state ID to transform
   */
  const ID = id => {
    return counter
      ? `${machineNode.id} ${id} ${counter.value}`
      : id
  }

  let stateConfig = {
    id: ID(stateNode.id),
    type: stateNode.parallel
      ? 'parallel'
      : (stateNode.final ? 'final' : undefined)
  }

  if (!disableCallbacks) {
    stateConfig.invoke = {
      src: rawstring(`callback('${stateNode.machineNode.id}/${stateNode.id}')`)
    }
  }

  const initialStateNode = stateNode.states.find(state => !!state.initial)

  if (initialStateNode) {
    stateConfig.initial = initialStateNode.id
  }

  if (stateNode.transitions.length) {
    stateConfig.on = stateNode.transitions.reduce((o, transition) => {
      if (transition.isForbidden) {
        o[transition.event] = {
          actions: []
        }
      } else {
        // NOTE (dschnare): We normalize all transition definitions to objects
        // since XState is currently buggy in how it handles transitions that are
        // not defined as objects.
        // See: https://github.com/davidkpiano/xstate/issues/569
        o[transition.event] = {
          target: transition.targets.map(s => {
            return `#${ID(s)}`
          }),
          // NOTE (dschnare): We add an empty action function here to workaround
          // an XState bug where if the target of a transition is a parent node
          // then it does not cause an exit and re-entry of the parent node.
          // However, with an empty action function the transition performs as
          // expected.
          actions: rawstring('function () {}')
        }
      }
      return o
    }, {})
  }

  if (stateNode.states.length) {
    const childXstateNodes = await Promise.all(stateNode.states.map(stateNode => {
      return toStateConfig({ stateNode, cache, toMachineConfig, counter, disableCallbacks })
    }))
    stateConfig.states = childXstateNodes.reduce((states, childXstateNode, index) => {
      states[stateNode.states[index].id] = childXstateNode
      return states
    }, {})
  }

  if (stateNode.useDirective) {
    let machineNode = await cache.findMachineById(stateNode.useDirective.machineId)
    const name = stateNode.useDirective.alias || stateNode.useDirective.machineId
    const machineCounter = Counter.get(machineNode.id)
    machineCounter.incr()

    // Override the machine ID based on the alias of the @use directive
    if (name !== stateNode.useDirective.machineId) {
      machineNode = machineNode.clone()
      machineNode.id = name
    }

    const machineConfig = await toMachineConfig({ machineNode, cache, disableCallbacks, counter: machineCounter })

    delete machineConfig.id

    stateConfig.initial = name
    stateConfig.states = {
      [name]: machineConfig
    }
  }

  return stateConfig
}
