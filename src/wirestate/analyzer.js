import * as FS from 'fs'
import * as Path from 'path'
import { promisify } from 'util'
import { makeTokenizer } from './tokenizer'
import { makeParser } from './parser'

const readFile = promisify(FS.readFile)

export const makeAnalyzer = () => {
  // Breadth-first walk of an AST graph. Calls visit for each AST node.
  const walk = (node, visit) => {
    let stack = [ node ]
    while (stack.length) {
      const n = stack.shift()
      switch (n.type) {
        case 'state':
          visit(n)
          n.transitions(t => visit(t))
          stack.push(...n.states)
          break
        case 'transition':
        case 'directive':
          visit(n)
          break
      }
    }
  }

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
        // Semantic Error
      } else {
        map[node.id] = node
      }
      return map
    }, {})

    const deferredStates = allStateNodes
      // Get all state nodes with an @include directive in their states array
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
          // Semantic Error
        }
      })

    // For atomic states that have child states set stateType to "compound"
    allStateNodes.filter(node => node.stateType === 'atomic').forEach(node => {
      if (node.states.length) {
        node.stateType = 'compound'
      }
    })

    // Verify there is only one top-level initial state
    if (ast.states.filter(n => n.initial).length > 1) {
      // Semantic Error
    }

    // If no initial top-level state then set first state to be initial
    if (ast.states.length && ast.states.filter(n => n.initial).length === 0) {
      ast.states[0].initial = true
    }

    // Verify compound states do not have duplicate initial states
    allStateNodes.filter(node => node.stateType === 'compound').forEach(node => {
      if (node.states.filter(n => n.initial).length > 1) {
        // Semantic Error
      }
    })

    // For compound states that have no initial state, set first state to be initial
    allStateNodes.filter(node => node.stateType === 'compound').forEach(node => {
      if (node.states.length && node.states.filter(n => n.initial).length === 0) {
        node.states[0].initial = true
      }
    })

    // Tokenize and parse @include directives and insert into child state arrays
    // (prefix ALL states with `${parent.id}.${state.id}`)
    const tokenizer = makeTokenizer()
    const parser = makeParser()
    await allStateNodes
      // Get all state nodes with an @include directive in their states array
      .filter(node => node.states.some(n => n.directiveType === '@include'))
      // For each node that has an @include directive we create a task that
      // will asynchronously load the the file referenced by the directive
      // then tokenize, parse and prefix all state node IDs.
      .map(() => async (node) => {
        const directiveNodes = node.states.filter(n => n.type === 'directive')
        await directiveNodes.map(() => async (d) => {
          const fileNameToInclude = Path.resolve(fileName, d.fileName)
          const text = await readFile(fileName, 'utf8')
          let tokens = []
          let includedAst = null

          try {
            tokens = tokenizer.tokenize(text)
            includedAst = parser.parse(tokens)
            includedAst = await analyze(includedAst)
          } catch (error) {
            throw Object.assign(new Error(`(FILE:${fileNameToInclude})::${error.message}`), error)
          }

          // If the directive node was not marked as being initial then set all
          // top-level state nodes in the included AST to initial = flase since
          // there will be some other state under the parent that is already
          // initial.
          includedAst.initial = !d.initial

          // Prefix all state IDs with the parent node's ID
          walk(includedAst, n => {
            if (n.type === 'state') {
              n.id = `${node.id}.${n.id}`
            } else if (n.type === 'transition') {
              n.target = `${node.id}.${n.target}`
            }
          })
          // Inline the AST states into the parent state
          node.states.splice(node.states.indexOf(d), 1, ...includedAst)

        // Run each directive parsing task sequentially
        }).reduce((p, task) => p.then(task), Promise.resolve())
      // Run each task sequentially
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
        // Semantic Error
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
          // Semantic Error
        }
      })

    return ast
  }

  return { analyze }
}
