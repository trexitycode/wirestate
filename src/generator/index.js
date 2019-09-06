/* eslint-disable-next-line */
import { CacheBase } from '../cache-base'
import { jsonGenerator } from './internal/json-generator'
import { xstateGenerator } from './internal/xstate'

export function makeGenerator () {
  /**
   * @param {CacheBase} cache
   * @param {Object} [options]
   * @param {string} [options.generatorName]
   * @param {boolean} [options.disableCallbacks] Flag when generating XState to disable callback mapping
   * @return {Promise<string>}
   */
  const generate = async (cache, { generatorName = 'json', disableCallbacks = false } = {}) => {
    if (!generatorName) {
      throw new Error('Generator name must be provided')
    }

    if (generatorName === 'json') return jsonGenerator(cache)
    if (generatorName === 'xstate') return xstateGenerator(cache, { disableCallbacks })

    throw new Error(`Generator "${generatorName}" not found`)
  }

  return { generate }
}
