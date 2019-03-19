import * as FS from 'fs'
import * as Path from 'path'
import { promisify } from 'util'
import { makeTokenizer } from './tokenizer'
import { makeParser } from './parser'

const readFile = promisify(FS.readFile)

/**
 * Breadth-first walk of an AST graph. Calls visit for each AST node.
 * @param {Object} node
 * @param {Function} visit
 */
export const walk = (node, visit) => {
  let stack = [ { node, parent: null } ]

  while (stack.length) {
    const { node, parent } = stack.shift()

    if (node.type === 'state') {
      visit(node, parent)
      node.transitions.forEach(t => visit(t, node))
      stack.push(...node.states.map(n => ({ node: n, parent: node })))
    } else if (node.type === 'directive') {
      visit(node, parent)
    }
  }
}

export const makeAnalyzer = () => {
  const analyze = async (ast, fileName = '') => {
    // Make deep copy
    ast = JSON.parse(JSON.stringify(ast))

    let allStateNodes = []
    let allTransitions = []
    walk(ast, node => {
      if (node.type === 'state') {
        allStateNodes.push(node)
      }
      if (node.type === 'transition') {
        allTransitions.push(node)
      }
    })

    // Verify no duplicate state IDs
    let allStateNodesMap = allStateNodes.reduce((map, node) => {
      if (node.id in map) {
        throw new Error(`SemanticError: Duplicate state ID "${node.id}"`)
      } else {
        map[node.id] = node
      }
      return map
    }, {})

    // Get all state nodes with an @include directive in their states array
    const deferredStates = allStateNodes
      .filter(node => node.states.some(n => n.directiveType === '@include'))

    // Verify transtion targets refer to existing state IDs
    // NOTE: Only look at targets that reference states within this statechart
    // and not 'done.state.${stateID}' or a state ID that is loaded from a
    // directive. The idea here is to fail as early as possible before processing
    // the directives.
    allTransitions
      .filter(node => !node.target.startsWith('done.state.'))
      .filter(node => {
        return node.target.indexOf('.') < 0 ||
          !deferredStates.some(n => node.target.startsWith(n.id + '.'))
      })
      .forEach(node => {
        if (!(node.target in allStateNodesMap)) {
          throw new Error(`SemanticError: Transition target not found "${node.target}"`)
        }
      })

    // NOTE: Can a 'transient' state have child states?

    // For atomic states that have child states, set their stateType to "compound"
    allStateNodes.filter(node => node.stateType === 'atomic').forEach(node => {
      if (node.states.length) {
        node.stateType = 'compound'
      }
    })

    // Verify there is only one initial child state for all compound states
    walk(ast, node => {
      if (node.stateType === 'compound' && node.states.filter(n => n.initial).length > 1) {
        throw new Error(`SemanticError: Only one child state can be marked as initial: "${node.id}"`)
      }
    })

    // If no child state is set to be initial then, set first child state to be initial
    walk(ast, node => {
      if (node.stateType === 'compound' && node.states.filter(n => n.initial).length === 0) {
        node.states[0].initial = true
      }
    })

    // Tokenize and parse @include directives and insert into child state arrays
    // (prefix ALL states with `${parent.id}.${state.id}`)
    const tokenizer = makeTokenizer()
    const parser = makeParser()
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
            const rootId = Path.basename(fileNameToInclude, Path.extname(fileNameToInclude))
            includedRootNode = parser.parse(tokens, rootId)
            includedRootNode = await analyze(includedRootNode, fileNameToInclude)
            includedRootNode.initial = includeNode.initial
          } catch (error) {
            throw Object.assign(new Error(`(FILE:${includeNode.fileName})::${error.message}`), error)
          }

          // Prefix all state IDs with the parent node's ID
          walk(includedRootNode, n => {
            if (n.type === 'state') {
              n.externalId = n.id
              n.id = `${parentNode.id}.${n.id}`
            } else if (n.type === 'transition') {
              n.target = `${parentNode.id}.${n.target}`
            }
          })

          // Replace the directive node in the parent node
          parentNode.states.splice(parentNode.states.indexOf(includeNode), 1, includedRootNode)

        // Run each directive parsing task sequentially
        }).reduce((p, task) => p.then(task), Promise.resolve())
      // Run each task that handles directives sequentially
      }).reduce((p, task) => p.then(task), Promise.resolve())

    // Re-scan all sate nodes after directives have been processed
    allStateNodes = []
    walk(ast, node => {
      if (node.type === 'state') {
        allStateNodes.push(node)
      }
    })

    // Verify no duplicate state IDs after processing directives
    allStateNodesMap = allStateNodes.reduce((map, node) => {
      if (node.id in map) {
        throw new Error(`SemanticError: Duplicate state ID "${node.id}"`)
      } else {
        map[node.id] = node
      }
      return map
    }, {})

    // Verify transtion targets from this statechart refer to existing state IDs
    // in deferred statecharts.
    allTransitions
      .filter(node => !node.target.startsWith('done.state.'))
      .filter(node => {
        return node.target.indexOf('.') > 0 &&
          deferredStates.some(n => node.target.startsWith(n.id + '.'))
      })
      .forEach(node => {
        if (!(node.target in allStateNodesMap)) {
          throw new Error(`SemanticError: Transition target not found "${node.target}"`)
        }
      })

    return ast
  }

  return { analyze }
}
