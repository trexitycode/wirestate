export class Node {
  constructor () {
    /** @type {StateNode} */
    this.parent = null
    this.type = ''
    this.line = 1
    this.column = 0
  }

  clone () {
    // @ts-ignore
    let inst = new this.constructor()
    Object.assign(inst, this)
    return inst
  }
}

export class StateNode extends Node {
  constructor () {
    super()
    this.type = 'state'
    this.name = ''
    this.initial = false
    this.final = false
    this.parallel = false
    this.stateType = ''
    this.indent = 0
    /** @type {Array<StateNode>} */
    this.states = []
    /** @type {TransitionNode[]} */
    this.transitions = []
  }

  get id () {
    let path = []
    /** @type {StateNode} */
    let s = this
    while (s) {
      path.push(s.name)
      s = s.parent
    }
    return path.reverse().join('.')
  }

  clone () {
    let inst = super.clone()
    inst.states = this.states.map(state => state.clone())
    inst.states.forEach(state => (state.parent = inst))
    inst.transitions = this.transitions.map(transition => transition.clone())
    inst.transitions.forEach(transition => (transition.parent = inst))
    return inst
  }
}

export class TransitionNode extends Node {
  constructor () {
    super()
    this.type = 'transition'
    this.event = ''
    this.target = ''
  }
}

export class DirectiveNode extends Node {
  constructor () {
    super()
    this.type = 'directive'
    this.directiveType = ''
  }
}

export class IncludeDirectiveNode extends DirectiveNode {
  constructor () {
    super()
    this.directiveType = '@include'
    this.fileName = ''
  }
}

/**
 * Breadth-first walk of an AST graph. Calls visit for each AST node.
 * @param {Node} node
 * @param {Function} visit
 */
export const walk = (node, visit) => {
  let stack = [ node ]

  while (stack.length) {
    const node = stack.shift()

    if (node instanceof StateNode) {
      visit(node)
      node.transitions.forEach(t => visit(t))
      stack.push(...node.states)
    } else if (node.type === 'directive') {
      visit(node)
    }
  }
}

/**
 * @param {TransitionNode} transitionNode
 * @return {StateNode}
 */
export const resolveState = (transitionNode) => {
  /** @param {StateNode} stateNode */
  const enumerateStates = (stateNode) => {
    /** @type {StateNode[]} */
    let states = []
    let s = stateNode

    while (s) {
      states = states.concat(s.states)
      if (!s.parent) states.push(s)
      s = s.parent
    }

    return states
  }

  let statesToSearch = enumerateStates(transitionNode.parent)
  const { target } = transitionNode

  while (statesToSearch.length) {
    const stateNode = statesToSearch.shift()
    const matchingStateNode = stateNode.states.find(child => child.name === target)

    if (matchingStateNode) {
      return matchingStateNode
    }
  }

  return null
}
