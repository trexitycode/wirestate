/* eslint-disable-next-line */
import { Cache } from '../../../cache'
import { toMachineConfig } from './internal/to-machine-config'
import { render } from './internal/template'

/**
 *
 * @param {Cache} cache
 */
export async function xstateGenerator (cache, { disableActions = false } = {}) {
  const wireStateFiles = [ ...cache.keys ]
  // Since the Map constructor takes an initializer like: [ [key, value], ... ]
  // we build an array of: [ [WireState machine ID, XState machine config], ... ]
  // array to new up a Map for the render function.
  /** @type {Array<[string, object]>} */
  const machineConfigsMapInitializer = await Promise.all(
    wireStateFiles.map(async wireStateFile => {
      const scopeNode = await cache.get(wireStateFile)
      return Promise.all(
        scopeNode.machines.map(async machineNode => {
          return [
            machineNode.id,
            await toMachineConfig({ machineNode, cache, disableActions })
          ]
        })
      )
    })
  ).then(_flatten)

  return render(new Map(machineConfigsMapInitializer))
}

/**
 * Flattens an array of arrays.
 *
 * @param {Array<any>[]} array
 * @return {any[]}
 */
function _flatten (array) {
  return array.reduce((a, b) => a.concat(b), [])
}
