/* eslint-disable-next-line */
import { Cache } from '../../cache'
/* eslint-disable-next-line */
import { MachineNode } from '../../ast-nodes'

const BLACKLISTED_PROPS = [ 'line', 'column', 'indent' ]

/**
 * @deprecated
 * @param {MachineNode} mainMachineNode
 * @param {Cache} cache
 */
export async function jsonGenerator (mainMachineNode, cache) {
  const replacer = _DiscardJsonReplacer(BLACKLISTED_PROPS)
  return JSON.stringify(cache, replacer, 2)
}

/**
 * Factory function that produces a JSON replacer function that will discard
 * properties that in the specified properties array.
 *
 * @param { string[] } props Property names to discard from all objects
 * @return { (key: string, value) => any }
 */
function _DiscardJsonReplacer (props) {
  return (key, value) => {
    if (props.includes(key)) {
      return undefined
    } else {
      return value
    }
  }
}
