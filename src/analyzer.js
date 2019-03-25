import * as FS from 'fs'
import * as Path from 'path'
import { promisify } from 'util'
import { makeTokenizer } from './tokenizer'
import { makeParser } from './parser'
import { walk, resolveState } from './ast-nodes'

const readFile = promisify(FS.readFile)

const analyze = async (stateNode, { fileName = '' } = {}) => {
  // Make deep copy
  stateNode = stateNode.clone()

  let allStateNodes = []
  let allTransitionNodes = []
  walk(stateNode, node => {
    if (node.type === 'state') {
      allStateNodes.push(node)
    }
    if (node.type === 'transition') {
      allTransitionNodes.push(node)
    }
  })

  let statesMap = Object.create(null)
  allStateNodes.forEach(stateNode => {
    if (stateNode.id in statesMap) {
      throw new Error(`SemanticError: State already exists: "${stateNode.name}" with ID: ${stateNode.id}`)
    }
  })

  // Transient states cannot have child states
  allStateNodes.filter(node => node.stateType === 'transient').forEach(node => {
    if (node.states.length !== 0) {
      throw new Error(`SemanticError: Transient states cannot have child states: "${node.name}"`)
    }
  })

  // For atomic states that have child states, set their stateType to "compound"
  allStateNodes.filter(node => node.stateType === 'atomic').forEach(node => {
    if (node.states.length) {
      node.stateType = 'compound'
    }
  })

  // Verify there is only one initial child state for all compound states
  walk(stateNode, node => {
    if (node.stateType === 'compound' && node.states.filter(n => n.initial).length > 1) {
      throw new Error(`SemanticError: Only one child state can be marked as initial: "${node.name}"`)
    }
  })

  // If no child state is set to be initial then, set first child state to be initial
  walk(stateNode, node => {
    if (node.stateType === 'compound' && node.states.filter(n => n.initial).length === 0) {
      node.states[0].initial = true
    }
  })

  // Tokenize and parse @include directives and insert into child state arrays
  // (prefix ALL states with `${parent.name}.${state.name}`)
  const tokenizer = makeTokenizer()
  const parser = makeParser()

  // Get all state nodes with an @include directive in their states array
  const deferredStates = allStateNodes
    .filter(node => node.states.some(n => n.directiveType === '@include'))

  await deferredStates
    // Get all state nodes with an @include directive in their states array
    .filter(node => node.states.some(n => n.directiveType === '@include'))
    // For each node that has an @include directive we create a task that
    // will asynchronously load the the file referenced by the directive
    // then tokenize, parse and prefix all state node IDs.
    .map(parentNode => async () => {
      const includeNodes = parentNode.states.filter(n => n.directiveType === '@include')

      await includeNodes.map(includeNode => async () => {
        const fileNameToInclude = Path.resolve(
          Path.dirname(fileName),
          includeNode.fileName
        )
        const text = await readFile(fileNameToInclude, 'utf8')
        let includedRootNode = null

        try {
          const tokens = tokenizer.tokenize(text)
          const rootName = Path.basename(fileNameToInclude, Path.extname(fileNameToInclude))
          includedRootNode = parser.parse(tokens, rootName)
          includedRootNode = await analyze(includedRootNode, { fileName: fileNameToInclude })
        } catch (error) {
          throw Object.assign(new Error(`(FILE:${includeNode.fileName})::${error.message}`), error)
        }

        // If there is only a single child state then we insert
        // this first child node, otherwise we insert the root node.
        const nodeToInsert = (
          includedRootNode.transitions.length === 0 &&
          includedRootNode.states.length === 1
        ) ? includedRootNode.states[0]
          : includedRootNode

        nodeToInsert.initial = includeNode.initial
        nodeToInsert.parent = parentNode

        // Replace the directive node in the parent node
        parentNode.states.splice(parentNode.states.indexOf(includeNode), 1, nodeToInsert)

      // Run each directive parsing task sequentially
      }).reduce((p, task) => p.then(task), Promise.resolve())
    // Run each task that handles directives sequentially
    }).reduce((p, task) => p.then(task), Promise.resolve())

  // Re-scan all sate nodes after directives have been processed
  allStateNodes = []
  walk(stateNode, node => {
    if (node.type === 'state') {
      allStateNodes.push(node)
    }
  })

  // Verify transtion targets from THIS statechart refer to existing state IDs
  // in deferred statecharts and ourselves.
  allTransitionNodes
    .filter(node => !node.target.startsWith('done.state.'))
    .forEach(node => {
      if (!resolveState(node)) {
        throw new Error(`SemanticError: Transition target not found "${node.target}"`)
      }
    })

  return stateNode
}

export const makeAnalyzer = () => {
  return { analyze }
}
