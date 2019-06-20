/* eslint-disable no-unused-vars */
import { Cache } from '../cache'
import { xstateGenerator } from './internal/xstate'
import { MachineNode } from '../ast-nodes'

export function makeGenerator () {
  /**
   * @param {MachineNode} mainMachineNode
   * @param {Cache} cache
   * @param {Object} [options]
   * @param {string} [options.generatorName]
   * @param {boolean} [options.disableActions] Flag when generating XState to disable action mapping
   * @return {Promise<string>}
   */
  const generate = async (mainMachineNode, cache, { disableActions = false } = {}) => {
    return xstateGenerator(mainMachineNode, cache, { disableActions })
  }

  return { generate }
}
