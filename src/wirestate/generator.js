import { walk } from './analyzer'

export function makeGenerator () {
  const generate = (ast, generatorName) => {
    if (!generatorName) {
      throw new Error('Generator name must be provided')
    }

    if (generatorName === 'xstate') return xstateGenerator(ast)
    if (generatorName === 'xstate-machine') return xstateMachineGenerator(ast)
    if (generatorName === 'xstate-machine-esm') return xstateMachineGeneratorEsm(ast)

    throw new Error(`Generator "${generatorName}" not found`)
  }
  return { generate }
}

function xstateGenerator (ast) {
  let stateMap = {}

  walk(ast, (node, parentNode) => {
    if (node.type === 'state') {
      const stateNode = { id: node.id, initial: undefined }
      stateMap[stateNode.id] = stateNode

      if (node.parallel) stateNode.type = 'parallel'
      if (node.final) stateNode.final = true

      if (node.transitions.length) {
        stateNode.on = node.transitions.reduce((o, transition) => {
          o[transition.event] = `#${transition.target}`
          return o
        }, {})
      }

      if (parentNode) {
        const parentStateNode = stateMap[parentNode.id]
        parentStateNode.states = parentStateNode.states || {}
        parentStateNode.states[stateNode.id] = stateNode
        if (node.initial) parentStateNode.initial = `#${stateNode.id}`
      }
    }
  })

  return JSON.stringify(stateMap[ast.id], null, 2)
}

function xstateMachineGenerator (ast) {
  return [
    "const { Machine } = require('xstate')\n\n",
    'module.exports = exports = Machine(', xstateGenerator(ast), ')'
  ].join('')
}

function xstateMachineGeneratorEsm (ast) {
  return [
    "import { Machine } from 'xstate'\n\n",
    'export default Machine(', xstateGenerator(ast), ')'
  ].join('')
}
