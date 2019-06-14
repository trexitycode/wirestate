/* eslint-disable no-unused-vars */
import { MachineNode } from '../../../../ast-nodes'
import { Cache } from '../../../../cache'
import { rawstring } from './rawstring'
import { Counter, CountingObject } from './counter'
import { toStateConfig } from './to-state-config'

/**
 * @param {object} [options]
 * @param {MachineNode} options.machineNode
 * @param {Cache} options.cache
 * @param {CountingObject} [options.counter]
 */
export async function toMachineConfig ({ machineNode, cache, counter = null }) {
  /**
   * Transforms a state ID into a qualified state ID for XState
   *
   * @param {string} id The state ID to transform
   */
  const ID = id => {
    return counter
      ? `${id} ${counter.value}`
      : id
  }

  let machineConfig = {
    id: ID(machineNode.id),
    initial: (machineNode.states.find(state => !!state.initial) || { id: undefined }).id,
    invoke: { src: rawstring(`action('${machineNode.id}')`) }
  }

  const initialStateNode = machineNode.states.find(state => !!state.initial)

  if (initialStateNode) {
    machineConfig.initial = initialStateNode.id
  }

  if (machineNode.transitions.length) {
    machineConfig.on = machineNode.transitions.reduce((o, transition) => {
      o[transition.event] = transition.target
      // o[transition.event] = transition.target.split(',').map(s => {
      //   return `#${ID(s.trim())}`
      // }).join(', ')
      return o
    }, {})
  }

  if (machineNode.states.length) {
    const childStateConfigs = await Promise.all(machineNode.states.map(stateNode => {
      return toStateConfig({ stateNode, cache, toMachineConfig, counter })
    }))
    machineConfig.states = childStateConfigs.reduce((states, childStateConfig, index) => {
      states[machineNode.states[index].id] = childStateConfig
      return states
    }, {})
  }

  return machineConfig
}
