/* eslint-disable-next-line */
import { CacheBase } from '../../../cache-base'
import { toMachineConfig } from './internal/to-machine-config'
import { render } from './internal/template'

/**
 *
 * @param {CacheBase} cache
 */
export async function xstateGenerator (cache, { disableCallbacks = false } = {}) {
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
            await toMachineConfig({ machineNode, cache, disableCallbacks })
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
