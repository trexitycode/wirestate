class Queue {
  constructor () {
    this._list = []
  }

  get isEmpty () {
    return this.count === 0
  }

  get count () {
    return this._list.length
  }

  enqueue (item) {
    this._list.push(item)
  }

  dequeue () {
    return this._list.shift()
  }
}

class OrderedSet {
  constructor () {
    this._items = []
  }

  get isEmpty () {
    return this.count === 0
  }

  get count () {
    return this._items.length
  }

  add (item) {
    if (this._items.indexOf(item) < 0) {
      this._items.push(item)
    }
  }

  delete (item) {
    const k = this._items.indexOf(item)
    if (k >= 0) {
      this._items.splice(k, 1)
    }
  }

  isMember (item) {
    return this._items.indexOf(item) >= 0
  }

  clear () {
    this._items = []
  }

  /** @param {OrderedSet} set */
  hasIntersection (set) {
    return set._items.some(it => this.isMember(it))
  }

  at (index) {
    return this._items[index]
  }

  some (fn) {
    return this._items.some(it => fn(it))
  }

  every (fn) {
    return this._items.every(it => fn(it))
  }

  toArray () {
    return this._items.slice()
  }
}

class Transition {
  /**
   * @param {string} event
   * @param {State[]} targets
   * @param {Object} options
   * @param {number} [options.documentOrder]
   */
  constructor (event, targets, { documentOrder = 0 } = {}) {
    this._event = event
    this._target = targets
    this._type = 'external'
    this._documentOrder = documentOrder
    /** @type {State} */
    this._source = null
  }

  get documentOrder () { return this._documentOrder }
  get type () { return this._type }
  get event () { return this._event }
  get target () { return this._target }
  get source () { return this._source }
}

/**
 * @param {State} source
 * @param {string} target
 */
const resolveState = (source, target) => {
  /** @param {State} stateNode */
  const enumerateStates = (stateNode) => {
    /** @type {State[]} */
    let states = []
    let s = stateNode

    while (s) {
      states = states.concat(s._states)
      if (!s.parent) states.push(s)
      s = s.parent
    }

    return states
  }

  let statesToSearch = enumerateStates(source)

  while (statesToSearch.length) {
    const stateNode = statesToSearch.shift()
    const matchingStateNode = stateNode._states.find(child => {
      return target === child.name
    })

    if (matchingStateNode) {
      return matchingStateNode
    }
  }

  return null
}

export class State {
  /**
   * @param {Object} stateConfig
   */
  static create (stateConfig, documentOrder = { _value: 1, get () { return this._value }, incr () { this._value += 1 } }) {
    /*
    StateConfig: {
      name: string
      initial?: boolean
      final?: boolean
      parallel?: boolean
      transitions?: { event: string, target: string }[]
      states?: StateConfig[]
    }
    */
    let rootState = null
    let configs = [ stateConfig ]

    let k = 0
    while (configs[k]) {
      const config = configs[k]

      if (!config.name) {
        throw new Error(`State config object missing 'name' property`)
      }

      configs.push(...config.states)
      k += 1
    }

    let states = []
    configs.forEach(config => {
      const s = new State(
        config.name,
        {
          documentOrder: documentOrder.get(),
          initial: !!config.initial,
          parallel: !!config.parallel,
          final: !!config.final
        }
      )
      states.push(config, s)

      if (!rootState) rootState = s
    })

    configs.forEach(config => {
      const s = states[states.indexOf(config) + 1]
      ;(config.states || []).forEach(childConfig => {
        const childState = states[states.indexOf(childConfig) + 1]
        s.addChild(childState)
      })
    })

    configs.forEach(config => {
      const s = states[states.indexOf(config) + 1]
      ;(config.transitions || []).forEach(transitionConfig => {
        const targetNames = transitionConfig.target.split(' ')
        const targets = targetNames.map(targetName => {
          const target = resolveState(s, targetName)

          if (!target) {
            throw new Error(`Transition target cannot be found '${targetName}'`)
          }

          return target
        })

        documentOrder.incr()
        s.addTransition(new Transition(transitionConfig.event, targets, { documentOrder: documentOrder.get() }))
      })
    })

    return rootState
  }

  /**
   * @param {string} name
   * @param {Object} options
   * @param {number} options.documentOrder
   * @param {boolean} [options.initial]
   * @param {boolean} [options.final]
   * @param {boolean} [options.parallel]
   */
  constructor (name, { documentOrder, initial = false, final = false, parallel = false }) {
    this._name = name
    this._initial = !!initial
    this._final = !!final
    this._parallel = !!parallel
    this._documentOrder = documentOrder
    /** @type {State} */
    this._parent = null
    /** @type {State[]} */
    this._states = []
    /** @type {Transition[]} */
    this._transitions = []
  }

  get name () { return this._name }
  get id () {
    let path = []
    /** @type {State} */
    let s = this
    while (s) {
      path.push(s.name)
      s = s.parent
    }
    return path.reverse().join('.')
  }
  get documentOrder () { return this._documentOrder }
  get parent () { return this._parent }
  get states () { return this._states.slice() }
  get transitions () { return this._transitions.slice() }
  get initial () {
    const array = this.states.filter(state => state._initial)
    return array.length === 0 ? [ this._states[0] ] : array
  }
  get final () { return this._final }
  get parallel () { return this._parallel }

  /**
   *
   * @param {Transition} transition
   */
  addTransition (transition) {
    if (transition._source) {
      throw new Error('Transition already added')
    }
    transition._source = this
    this._transitions.push(transition)
  }

  /** @param {State} state */
  addChild (state) {
    if (state.parent) {
      throw new Error('State already is a child: ' + state.id)
    }
    state._parent = this
    this._states.push(state)
  }
}

/** @param {State} state */
const isFinalState = (state) => state.final
/** @param {State} state */
const isAtomicState = (state) => !isCompoundState(state) && !isParallelState(state)
/** @param {State} state */
const isCompoundState = (state) => !isParallelState(state) && getChildStates(state).length > 0
/** @param {State} state */
const isParallelState = (state) => state.parallel
/** @param {State} state */
const isSCXMLElement = (state) => !state.parent
/** @param {string} event */
const isCancelEvent = (event) => event === 'cancel.machine'
/** @param {State} state */
const getChildStates = (state) => state.states

function buildRegExp (string) {
  if (string === '*') return new RegExp('\\w+(\\.\\w+)*')
  string = string.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\.\\\*|\\\.$/g, '(\\.\\w+)*?')
    .replace(/^\\\*/, '(\\w+(\\.\\w+)*?)?')
  return new RegExp('^' + string)
}

/**
 * Match a transition event pattern(s) to an event.
 *
 * Transition event patterns can be:
 *
 * PATTERN            MATCHES EVENTS LIKE
 * '*'                anything, foo.event, something
 * *.foo              foo, something.foo, something.foo.anything
 * foo                foo
 * foo.               foo, foo.something, foo.something.two
 * foo.*              foo, foo.something, foo.something.two
 * foo.*.Modal        foo.anything.Modal
 * foo.*.Modal.       foo.anything.Modal, foo.anything.something.Modal.Another
 * foo.*.One.*.Two    foo.One.Two, foo.anything.One.something.Two
 *
 * @param {string} transitionEvent
 * @param {string} event
 */
const nameMatch = (transitionEvent, event) => {
  const tEvents = transitionEvent.split(' ')

  return tEvents.some(tEvent => {
    if (tEvent === '*') return true
    const regex = buildRegExp(tEvent)
    return regex.test(event)
  })
}

const documentOrder = (a, b) => a.documentOrder - b.documentOrder
const entryOrder = (a, b) => a.documentOrder - b.documentOrder
const exitOrder = (a, b) => b.documentOrder - a.documentOrder

const nextTick = (fn) => {
  if (typeof process === 'object') {
    process.nextTick(fn)
  } else {
    setTimeout(fn, 0)
  }
}

export class Interpreter {
  constructor () {
    /** @type {{ type: string, listener: Function }[]} */
    this._listeners = []

    // Emit an event that invokes registered listeners
    this._emit = (eventType, ...args) => {
      this._listeners.filter(reg => {
        return reg.type === eventType
      }).forEach(reg => {
        reg.listener(...args)
      })
    }

    // Only used in the 'entry' and 'exit' events.
    // Late-binds to 'this' so that we can re-use the
    // same function for all events.
    this._matches = function (stateDescriptor) {
      const regexp = buildRegExp(stateDescriptor)
      // @ts-ignore
      const atomic = this.configuration.filter(isAtomicState)
      return atomic.some(state => {
        const id = state.id
        return regexp.test(id)
      })
    }
  }

  onEntry (listener) {
    this._listeners.push({ type: 'entry', listener })
  }

  onExit (listener) {
    this._listeners.push({ type: 'exit', listener })
  }

  onTransition (listener) {
    this._listeners.push({ type: 'transition', listener })
  }

  onEvent (listener) {
    this._listeners.push({ type: 'event', listener })
  }

  onDone (listener) {
    this._listeners.push({ type: 'done', listener })
  }

  /** @param {State} state */
  start (state) {
    this.configuration = new OrderedSet()
    this.internalQueue = new Queue()
    this.externalQueue = new Queue()
    this.running = true
    const t = new Transition('', state.initial)
    t._source = state
    this.enterStates([ t ])
    this.mainEventLoop()
  }

  send (event) {
    if (!this.running) return
    this.externalQueue.enqueue(event)
  }

  /// //////////////////
  // PRIVATE METHODS //
  /// //////////////////

  mainEventLoop () {
    this.processInternalEvents()
    this.processNextExternalEvent()

    if (this.running) {
      nextTick(() => {
        this.mainEventLoop()
      })
    } else {
      this.exitInterpreter()
    }
  }

  processInternalEvents () {
    /** @type {OrderedSet} */
    let enabledTransitions = null
    let macrostepDone = false
    // Here we handle eventless transitions and transitions
    // triggered by internal events until macrostep is complete
    while (this.running && !macrostepDone) {
      if (this.internalQueue.isEmpty) {
        macrostepDone = true
      } else {
        /** @type {string} */
        let internalEvent = this.internalQueue.dequeue()
        enabledTransitions = this.selectTransitions(internalEvent)
      }

      if (enabledTransitions && !enabledTransitions.isEmpty) {
        this.microstep(enabledTransitions.toArray())
        enabledTransitions = null
      }
    }
  }

  processNextExternalEvent () {
    if (this.externalQueue.isEmpty || !this.running) return

    let externalEvent = this.externalQueue.dequeue()
    this._emit('event', externalEvent)
    if (isCancelEvent(externalEvent)) {
      this.running = false
      return
    }
    let enabledTransitions = this.selectTransitions(externalEvent)
    if (!enabledTransitions.isEmpty) {
      this.microstep(enabledTransitions.toArray())
    }
  }

  /**
   *
   * @param {State} state
   * @return {boolean}
   */
  isInFinalState (state) {
    if (isCompoundState(state)) {
      return getChildStates(state).some(s => isFinalState(s) && this.configuration.isMember(s))
    } else if (isParallelState(state)) {
      return getChildStates(state).every(s => this.isInFinalState(s))
    } else {
      return false
    }
  }

  /**
   *
   * @param {Transition[]} enabledTransitions
   */
  enterStates (enabledTransitions) {
    let statesToEnter = new OrderedSet()
    let statesForDefaultEntry = new OrderedSet()
    computeEntrySet(enabledTransitions, statesToEnter, statesForDefaultEntry)
    for (let s of statesToEnter.toArray().sort(entryOrder)) {
      this.configuration.add(s)
      this._emit('entry', {
        configuration: [ s ],
        matches: this._matches
      })
      if (isFinalState(s)) {
        if (isSCXMLElement(s.parent)) {
          this.running = false
        } else {
          let parent = s.parent
          let grandparent = parent.parent
          this.internalQueue.enqueue('done.state.' + parent.id)
          if (isParallelState(grandparent)) {
            if (getChildStates(grandparent).every(s => this.isInFinalState(s))) {
              this.internalQueue.enqueue('done.state.' + grandparent.id)
            }
          }
        }
      }
    }
    this._emit('transition', {
      configuration: this.configuration.toArray(),
      matches: this._matches
    })
  }

  /**
   *
   * @param {Transition[]} transitions
   * @return {OrderedSet}
   */
  computeExitSet (transitions) {
    let statesToExit = new OrderedSet()
    for (let t of transitions) {
      if (t.target.length) {
        let domain = getTransitionDomain(t)
        for (let s of this.configuration.toArray()) {
          if (isDescendant(s, domain)) {
            statesToExit.add(s)
          }
        }
      }
    }
    return statesToExit
  }

  /**
   *
   * @param {Transition[]} enabledTransitions
   */
  exitStates (enabledTransitions) {
    let statesToExit = this.computeExitSet(enabledTransitions)
    for (let s of statesToExit.toArray().sort(exitOrder)) {
      this.configuration.delete(s)
      this._emit('exit', {
        configuration: [ s ],
        matches: this._matches
      })
    }
  }

  /**
   *
   * @param {Transition[]} enabledTransitions
   */
  microstep (enabledTransitions) {
    this.exitStates(enabledTransitions)
    this.enterStates(enabledTransitions)
  }

  /**
   *
   * @param {OrderedSet} enabledTransitions
   * @return {OrderedSet}
   */
  removeConflictingTransitions (enabledTransitions) {
    let filteredTransitions = new OrderedSet()
    for (let t1 of enabledTransitions.toArray()) {
      let t1Preempted = false
      let transitionsToRemove = new OrderedSet()
      for (let t2 of filteredTransitions.toArray()) {
        if (this.computeExitSet([ t1 ]).hasIntersection(this.computeExitSet([ t2 ]))) {
          if (isDescendant(t1.source, t2.source)) {
            transitionsToRemove.add(t2)
          } else {
            t1Preempted = true
            break
          }
        }
      }
      if (!t1Preempted) {
        for (let t3 of transitionsToRemove.toArray()) {
          filteredTransitions.delete(t3)
        }
        filteredTransitions.add(t1)
      }
    }
    return filteredTransitions
  }

  /**
   *
   * @param {string} event
   * @return {OrderedSet}
   */
  selectTransitions (event) {
    let enabledTransitions = new OrderedSet()
    let atomicStates = this.configuration.toArray().filter(isAtomicState).sort(documentOrder)
    for (let state of atomicStates) {
      let loop = true
      for (let s of [ state ].concat(getProperAncestors(state, null))) {
        if (!loop) break
        for (let t of s.transitions.sort(documentOrder)) {
          if (t.event && nameMatch(t.event, event)) {
            enabledTransitions.add(t)
            loop = false
            break
          }
        }
      }
    }
    enabledTransitions = this.removeConflictingTransitions(enabledTransitions)
    return enabledTransitions
  }

  exitInterpreter () {
    let statesToExit = this.configuration.toArray().sort(exitOrder)
    for (let s of statesToExit) {
      this.configuration.delete(s)
      if (isFinalState(s) && isSCXMLElement(s.parent)) {
        this._emit('done')
      }
    }
  }
}

/**
 * @param {State} childState
 * @param {State} parentState
 */
function isDescendant (childState, parentState) {
  const childStates = getChildStates(parentState)
  if (childStates.find(state => state === childState)) {
    return true
  } else {
    return childStates.some(s => isDescendant(childState, s))
  }
}

/**
 *
 * @param {State} state1
 * @param {State} state2
 * @return {State[]}
 */
function getProperAncestors (state1, state2) {
  let ancestors = []

  let s = state1
  while (s) {
    if (isSCXMLElement(s)) {
      ancestors.push(s)
    } else if (s.parent) {
      ancestors.push(s.parent)
    }
    s = s.parent
  }

  if (!state2) return ancestors

  if (state1.parent === state2 || state1 === state2 || isDescendant(state2, state1)) return []
  const k = ancestors.findIndex(s => s === state2)
  if (k > 0) return ancestors.slice(0, k)

  return ancestors
}

/**
 *
 * @param {Transition} transition
 * @return {OrderedSet}
 */
function getEffectiveTargetStates (transition) {
  let targets = new OrderedSet()
  transition.target.forEach(target => targets.add(target))
  return targets
}

/**
 *
 * @param {State[]} stateList
 * @return {State}
 */
function findLCCA (stateList) {
  const head = stateList[0]
  const tail = stateList.slice(1)
  for (let anc of getProperAncestors(head, null).filter(s => isCompoundState(s) || isSCXMLElement(s))) {
    if (tail.every(s => isDescendant(s, anc))) {
      return anc
    }
  }
  return null
}

/**
 *
 * @param {Transition} transition
 * @return {State}
 */
function getTransitionDomain (transition) {
  let tstates = getEffectiveTargetStates(transition)
  if (!tstates) {
    return null
  } else if (transition.type === 'internal' && getChildStates(transition.source).length && tstates.every(s => isDescendant(s, transition.source))) {
    return transition.source
  } else {
    return findLCCA([ transition.source ].concat(tstates.toArray()))
  }
}

/**
 *
 * @param {State} state
 * @param {State} ancestor
 * @param {OrderedSet} statesToEnter
 * @param {OrderedSet} statesForDefaultEntry
 */
function addAncestorStatesToEnter (state, ancestor, statesToEnter, statesForDefaultEntry) {
  for (let anc of getProperAncestors(state, ancestor)) {
    statesToEnter.add(anc)
    if (isParallelState(anc)) {
      for (let child of getChildStates(anc)) {
        if (!statesToEnter.some(s => isDescendant(s, child))) {
          addDescendantStatesToEnter(child, statesToEnter, statesForDefaultEntry)
        }
      }
    }
  }
}

/**
 *
 * @param {State} state
 * @param {OrderedSet} statesToEnter
 * @param {OrderedSet} statesForDefaultEntry Not used
 */
function addDescendantStatesToEnter (state, statesToEnter, statesForDefaultEntry) {
  statesToEnter.add(state)
  if (isCompoundState(state)) {
    statesForDefaultEntry.add(state)
    for (let s of state.initial) {
      addDescendantStatesToEnter(s, statesToEnter, statesForDefaultEntry)
    }
    for (let s of state.initial) {
      addAncestorStatesToEnter(s, state, statesToEnter, statesForDefaultEntry)
    }
  } else {
    if (isParallelState(state)) {
      for (let child of getChildStates(state)) {
        if (!statesToEnter.some(s => isDescendant(s, child))) {
          addDescendantStatesToEnter(child, statesToEnter, statesForDefaultEntry)
        }
      }
    }
  }
}

/**
 *
 * @param {Transition[]} transitions
 * @param {OrderedSet} statesToEnter
 * @param {OrderedSet} statesForDefaultEntry
 */
function computeEntrySet (transitions, statesToEnter, statesForDefaultEntry) {
  for (let t of transitions) {
    for (let s of t.target) {
      addDescendantStatesToEnter(s, statesToEnter, statesForDefaultEntry)
    }
    let ancestor = getTransitionDomain(t)
    for (let s of getEffectiveTargetStates(t).toArray()) {
      addAncestorStatesToEnter(s, ancestor, statesToEnter, statesForDefaultEntry)
    }
  }
}
