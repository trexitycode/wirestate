/* eslint-disable no-unused-vars */
import { MachineNode } from '../../../../ast-nodes'
import { Cache } from '../../../../cache'
import { rawstring } from './rawstring'
import { CountingObject } from './counter'
import { toStateConfig } from './to-state-config'

/**
 * @param {object} [options]
 * @param {MachineNode} options.machineNode
 * @param {Cache} options.cache
 * @param {CountingObject} [options.counter]
 * @param {boolean} [options.disableCallbacks]
 */
export async function toMachineConfig ({ machineNode, cache, counter = null, disableCallbacks = false }) {
  /**
   * Transforms a machine ID into a qualified machine ID for XState
   *
   * @param {string} id The machine ID to transform
   */
  const ID = id => {
    return counter
      ? `${id} ${counter.value}`
      : id
  }

  /**
   * Transforms a state ID into a qualified state ID for XState
   *
   * @param {string} id The state ID to transform
   */
  const StateID = id => {
    return counter
      ? `${machineNode.id} ${id} ${counter.value}`
      : id
  }

  let machineConfig = {
    id: ID(machineNode.id),
    initial: (machineNode.states.find(state => !!state.initial) || { id: undefined }).id
  }

  if (!disableCallbacks) {
    machineConfig.invoke = { src: rawstring(`callback('${machineNode.id}')`) }
  }

  const initialStateNode = machineNode.states.find(state => !!state.initial)

  if (initialStateNode) {
    machineConfig.initial = initialStateNode.id
  }

  if (machineNode.transitions.length) {
    machineConfig.on = machineNode.transitions.reduce((o, transition) => {
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
            return `#${StateID(s)}`
          })
        }
      }
      return o
    }, {})
  }

  if (machineNode.states.length) {
    const childStateConfigs = await Promise.all(machineNode.states.map(stateNode => {
      return toStateConfig({ stateNode, cache, toMachineConfig, counter, disableCallbacks })
    }))
    machineConfig.states = childStateConfigs.reduce((states, childStateConfig, index) => {
      states[machineNode.states[index].id] = childStateConfig
      return states
    }, {})
  }

  return machineConfig
}
