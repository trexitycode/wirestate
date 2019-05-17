/* eslint-disable-next-line */
import { resolveState, ScopeNode } from './ast-nodes'

export function makeGenerator () {
  /**
   * @param {StateNode} node
   * @param {string} generatorName
   */
  const generate = (node, generatorName) => {
    if (!generatorName) {
      throw new Error('Generator name must be provided')
    }

    if (generatorName === 'json') return jsonGenerator(node)
    if (generatorName === 'json-commonjs') return jsonCommonJsGenerator(node)
    if (generatorName === 'json-esm') return jsonEsmGenerator(node)

    throw new Error(`Generator "${generatorName}" not found`)
  }
  return { generate }
}

/** @param {ScopeNode} scopeNode */
function jsonGenerator (scopeNode) {
  return JSON.stringify(scopeNode, null, 2)
}

/** @param {ScopeNode} scopeNode */
function jsonCommonJsGenerator (scopeNode) {
  return [
    'exports.config = ', jsonGenerator(scopeNode)
  ].join('')
}

/** @param {ScopeNode} scopeNode */
function jsonEsmGenerator (scopeNode) {
  return [
    'export const config = ', jsonGenerator(scopeNode)
  ].join('')
}
