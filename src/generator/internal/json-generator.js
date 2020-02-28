/* eslint-disable-next-line */
import { CacheBase } from '../../cache-base'

const BLACKLISTED_PROPS = ['line', 'column', 'indent']

/** @param {CacheBase} cache */
export function jsonGenerator (cache) {
  const replacer = DiscardJsonReplacer(BLACKLISTED_PROPS)
  return JSON.stringify(cache, replacer, 2)
}

/**
 * Factory function that produces a JSON replacer function that will discard
 * properties that in the specified properties array.
 *
 * @param { string[] } props Property names to discard from all objects
 * @return { (key: string, value) => any }
 */
function DiscardJsonReplacer (props) {
  return (key, value) => {
    if (props.includes(key)) {
      return undefined
    } else {
      return value
    }
  }
}
