import { walk } from './analyzer'

export function makeGenerator () {
  const generate = (ast, generatorName) => {
    if (!generatorName) {
      throw new Error('Generator name must be provided')
    }

    if (generatorName === 'xstate-config') return xstateConfigGenerator(ast)
    if (generatorName === 'xstate-config-commonjs') return xstateConfigCommonJsGenerator(ast)
    if (generatorName === 'xstate-config-esm') return xstateConfigEsmGenerator(ast)
    if (generatorName === 'xstate-machine') return xstateMachineGenerator(ast)
    if (generatorName === 'xstate-machine-esm') return xstateMachineGeneratorEsm(ast)

    throw new Error(`Generator "${generatorName}" not found`)
  }
  return { generate }
}

function xstateConfigGenerator (ast) {
  let stateMap = {}

  walk(ast, (node, parentNode) => {
    if (node.type === 'state') {
      const stateNode = { id: node.id, initial: undefined }
      if (node.externalId) stateNode.externalId = node.externalId
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

function xstateConfigCommonJsGenerator (ast) {
  return [
    'exports.config = ', xstateConfigGenerator(ast)
  ].join('')
}

function xstateConfigEsmGenerator (ast) {
  return [
    'export const config = ', xstateConfigGenerator(ast)
  ].join('')
}

function xstateMachineGenerator (ast) {
  return [
    "const { Machine } = require('xstate')\n\n",
    'exports.machine = Machine(', xstateConfigGenerator(ast), ')'
  ].join('')
}

function xstateMachineGeneratorEsm (ast) {
  return [
    "import { Machine } from 'xstate'\n\n",
    'export cons machine = Machine(', xstateConfigGenerator(ast), ')'
  ].join('')
}
