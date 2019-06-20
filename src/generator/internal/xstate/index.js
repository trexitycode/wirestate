/* eslint-disable-next-line */
import { Cache } from '../../../cache'
import { toMachineConfig } from './internal/to-machine-config'
import { render } from './internal/template'
/* eslint-disable-next-line */
import { MachineNode } from '../../../ast-nodes'

/**
 * @param {Cache} cache
 */
export async function xstateGenerator (mainMachineNode, cache, { disableActions = false } = {}) {
  return _generateFirstMachine(mainMachineNode, cache, { disableActions })
}

/**
 * @param {MachineNode} mainMachineNode
 * @param {Cache} cache
 * @param {Object} options
 * @param {boolean} options.disableActions
 * @return {Promise<string>}
 */
async function _generateFirstMachine (mainMachineNode, cache, { disableActions }) {
  // Since the Map constructor takes an initializer like: [ [key, value], ... ]
  // we build an array of: [ [WireState machine ID, XState machine config], ... ]
  // array to new up a Map for the render function.
  const machineConfig = await toMachineConfig({
    machineNode: mainMachineNode,
    cache,
    disableActions
  })

  return render(machineConfig)
}

// /**
//  * @param {Cache} cache
//  * @param {Object} options
//  * @param {boolean} options.disableActions
//  * @return {Promise<Array<[string, object]>>}
//  */
// async function _generateAllMachines (cache, { disableActions }) {
//   const wireStateFiles = [ ...cache.keys ]

//   /** @type {Array<[string, object]>} */
//   const machineConfigsMapInitializer = await Promise.all(
//     wireStateFiles.map(async wireStateFile => {
//       const scopeNode = await cache.get(wireStateFile)
//       return Promise.all(
//         scopeNode.machines.map(async machineNode => {
//           return [
//             machineNode.id,
//             await toMachineConfig({ machineNode, cache, disableActions })
//           ]
//         })
//       )
//     })
//   ).then(_flatten)

//   return machineConfigsMapInitializer
// }

// /**
//  * Flattens an array of arrays.
//  *
//  * @param {Array<any>[]} array
//  * @return {any[]}
//  */
// function _flatten (array) {
//   return array.reduce((a, b) => a.concat(b), [])
// }
