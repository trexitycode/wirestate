export class Node {
  /**
   * @param {string} type
   */
  constructor (type) {
    /** @type {Node} */
    this.parent = null
    this.type = type
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

export class ScopeNode extends Node {
  constructor () {
    super('scope')
    this.imports = []
    this.machines = []
  }

  clone () {
    let inst = super.clone()
    inst.imports = this.imports.map(n => n.clone())
    inst.imports.forEach(n => (n.parent = inst))
    inst.machines = this.machines.map(n => n.clone())
    inst.machines.forEach(n => (n.parent = inst))
  }
}

export class ImportNode extends Node {
  /**
   * @param {string[]} machineIds
   * @param {string} file
   */
  constructor (machineIds, file) {
    super('import')
    this.machineIds = machineIds.slice()
    this.file = file
  }

  clone () {
    let inst = super.clone()
    inst.machineIds = this.machineIds.slice()
    return inst
  }
}

export class MachineNode extends Node {
  /** @param {string} id */
  constructor (id) {
    super('machine')
    this.id = id
    this.indent = 0
    /** @type {Array<StateNode>} */
    this.states = []
    /** @type {TransitionNode[]} */
    this.transitions = []
    /** @type {EventProtocolNode[]} */
    this.eventProtocols = []
  }

  clone () {
    let inst = super.clone()
    inst.states = this.states.map(n => n.clone())
    inst.states.forEach(n => (n.parent = inst))
    inst.transitions = this.transitions.map(n => n.clone())
    inst.transitions.forEach(n => (n.parent = inst))
    inst.eventProtocols = this.eventProtocols.map(n => n.clone())
    inst.eventProtocols.forEach(n => (n.parent = inst))
    return inst
  }
}

export class EventProtocolNode extends Node {
  /** @param {string} event */
  constructor (event) {
    super('eventProtocol')
    this.event = event
  }
}

export class StateNode extends Node {
  /**
   * @param {string} id
   * @param {number} indent
   */
  constructor (id, indent) {
    super('state')
    this.id = id
    this.initial = false
    this.final = false
    this.parallel = false
    this.stateType = 'atomic'
    this.indent = indent
    /** @type {Array<StateNode>} */
    this.states = []
    /** @type {TransitionNode[]} */
    this.transitions = []
    /** @type {EventProtocolNode[]} */
    this.eventProtocols = []
  }

  // get id () {
  //   let path = []
  //   /** @type {StateNode} */
  //   let s = this
  //   while (s) {
  //     path.push(s.name)
  //     s = s.parent
  //   }
  //   return path.reverse().join('.')
  // }

  clone () {
    let inst = super.clone()
    inst.states = this.states.map(n => n.clone())
    inst.states.forEach(n => (n.parent = inst))
    inst.transitions = this.transitions.map(n => n.clone())
    inst.transitions.forEach(n => (n.parent = inst))
    inst.eventProtocols = this.eventProtocols.map(n => n.clone())
    inst.eventProtocols.forEach(n => (n.parent = inst))
    return inst
  }
}

export class TransitionNode extends Node {
  /**
   * @param {string} event
   * @param {string} target
   */
  constructor (event, target) {
    super('transition')
    this.event = event
    this.target = target
  }
}

export class DirectiveNode extends Node {
  /**
   * @param {string} directiveType
   */
  constructor (directiveType) {
    super('directive')
    this.directiveType = directiveType
  }
}

export class UseDirectiveNode extends DirectiveNode {
  /**
   * @param {string} machineId
   */
  constructor (machineId) {
    super('@user')
    this.machineId = machineId
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

    if (node instanceof ScopeNode) {
      visit(node)
      stack.push(...node.imports)
      stack.push(...node.machines)
    } else if (node instanceof StateNode) {
      visit(node)
      node.transitions.forEach(t => visit(t))
      node.eventProtocols.forEach(t => visit(t))
      stack.push(...node.states)
    } else if (node instanceof MachineNode) {
      visit(node)
      node.transitions.forEach(t => visit(t))
      node.eventProtocols.forEach(t => visit(t))
      stack.push(...node.states)
    } else {
      visit(node)
    }
  }
}

/**
 * @param {TransitionNode} transitionNode
 * @return {StateNode}
 */
export const resolveState = (transitionNode) => {
  /** @param {any} stateNode */
  const enumerateStates = (stateNode) => {
    /** @type {StateNode[]} */
    let states = []
    let s = stateNode

    while (s) {
      states = states.concat(s.states)
      if (!s.parent) states.push(s)
      // @ts-ignore
      s = s.parent
    }

    return states
  }

  // TODO: Needs to be refactored so that ALL states in the machine
  // are searched

  let statesToSearch = transitionNode.parent instanceof MachineNode
    ? []
    : enumerateStates(transitionNode.parent)
  const { target } = transitionNode

  while (statesToSearch.length) {
    const stateNode = statesToSearch.shift()
    const matchingStateNode = stateNode.states.find(child => child.id === target)

    if (matchingStateNode) {
      return matchingStateNode
    }
  }

  return null
}
