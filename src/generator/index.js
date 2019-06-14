/* eslint-disable-next-line */
import { Cache } from '../cache'
import { jsonGenerator } from './internal/json-generator'
import { xstateGenerator } from './internal/xstate'

export function makeGenerator () {
  /**
   * @param {Cache} cache
   * @param {Object} [options]
   * @param {string} [options.generatorName]
   * @return {Promise<string>}
   */
  const generate = async (cache, { generatorName = 'json' } = {}) => {
    if (!generatorName) {
      throw new Error('Generator name must be provided')
    }

    if (generatorName === 'json') return jsonGenerator(cache)
    if (generatorName === 'xstate') return xstateGenerator(cache)

    throw new Error(`Generator "${generatorName}" not found`)
  }

  return { generate }
}
