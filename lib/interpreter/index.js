"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Queue = /** @class */ (function () {
    function Queue() {
        this._list = [];
    }
    Object.defineProperty(Queue.prototype, "isEmpty", {
        get: function () {
            return this.count === 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Queue.prototype, "count", {
        get: function () {
            return this._list.length;
        },
        enumerable: true,
        configurable: true
    });
    Queue.prototype.enqueue = function (item) {
        this._list.push(item);
    };
    Queue.prototype.dequeue = function () {
        return this._list.shift();
    };
    return Queue;
}());
exports.Queue = Queue;
var OrderedSet = /** @class */ (function () {
    function OrderedSet() {
        this._items = [];
    }
    Object.defineProperty(OrderedSet.prototype, "isEmpty", {
        get: function () {
            return this.count === 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OrderedSet.prototype, "count", {
        get: function () {
            return this._items.length;
        },
        enumerable: true,
        configurable: true
    });
    OrderedSet.prototype.add = function (item) {
        if (this._items.indexOf(item) < 0) {
            this._items.push(item);
        }
    };
    OrderedSet.prototype.delete = function (item) {
        var k = this._items.indexOf(item);
        if (k >= 0) {
            this._items.splice(k, 1);
        }
    };
    OrderedSet.prototype.isMember = function (item) {
        return this._items.indexOf(item) >= 0;
    };
    OrderedSet.prototype.clear = function () {
        this._items = [];
    };
    /** @param {OrderedSet} set */
    OrderedSet.prototype.hasIntersection = function (set) {
        var _this = this;
        return set._items.some(function (it) { return _this.isMember(it); });
    };
    OrderedSet.prototype.at = function (index) {
        return this._items[index];
    };
    OrderedSet.prototype.some = function (fn) {
        return this._items.some(function (it) { return fn(it); });
    };
    OrderedSet.prototype.every = function (fn) {
        return this._items.every(function (it) { return fn(it); });
    };
    OrderedSet.prototype.toArray = function () {
        return this._items.slice();
    };
    return OrderedSet;
}());
exports.OrderedSet = OrderedSet;
var Transition = /** @class */ (function () {
    /**
     * @param {string} event
     * @param {State[]} targets
     * @param {Object} options
     * @param {number} [options.documentOrder]
     */
    function Transition(event, targets, _a) {
        var _b = (_a === void 0 ? {} : _a).documentOrder, documentOrder = _b === void 0 ? 0 : _b;
        this._event = event;
        this._target = targets;
        this._type = 'external';
        this._documentOrder = documentOrder;
        /** @type {State} */
        this._source = null;
    }
    Object.defineProperty(Transition.prototype, "documentOrder", {
        get: function () { return this._documentOrder; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Transition.prototype, "type", {
        get: function () { return this._type; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Transition.prototype, "event", {
        get: function () { return this._event; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Transition.prototype, "target", {
        get: function () { return this._target; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Transition.prototype, "source", {
        get: function () { return this._source; },
        enumerable: true,
        configurable: true
    });
    return Transition;
}());
exports.Transition = Transition;
/**
 * @param {State} source
 * @param {string} target
 */
var resolveState = function (source, target) {
    /** @param {State} stateNode */
    var enumerateStates = function (stateNode) {
        /** @type {State[]} */
        var states = [];
        var s = stateNode;
        while (s) {
            states = states.concat(s._states);
            if (!s.parent)
                states.push(s);
            s = s.parent;
        }
        return states;
    };
    var statesToSearch = enumerateStates(source);
    while (statesToSearch.length) {
        var stateNode = statesToSearch.shift();
        var matchingStateNode = stateNode._states.find(function (child) {
            return target === child.name;
        });
        if (matchingStateNode) {
            return matchingStateNode;
        }
    }
    return null;
};
var State = /** @class */ (function () {
    /**
     * @param {string} name
     * @param {Object} options
     * @param {number} options.documentOrder
     * @param {boolean} [options.initial]
     * @param {boolean} [options.final]
     * @param {boolean} [options.parallel]
     */
    function State(name, _a) {
        var documentOrder = _a.documentOrder, _b = _a.initial, initial = _b === void 0 ? false : _b, _c = _a.final, final = _c === void 0 ? false : _c, _d = _a.parallel, parallel = _d === void 0 ? false : _d;
        this._name = name;
        this._initial = !!initial;
        this._final = !!final;
        this._parallel = !!parallel;
        this._documentOrder = documentOrder;
        /** @type {State} */
        this._parent = null;
        /** @type {State[]} */
        this._states = [];
        /** @type {Transition[]} */
        this._transitions = [];
    }
    /**
     * @param {Object} stateConfig
     */
    State.create = function (stateConfig, documentOrder) {
        if (documentOrder === void 0) { documentOrder = { _value: 1, get: function () { return this._value; }, incr: function () { this._value += 1; } }; }
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
        var rootState = null;
        var configs = [stateConfig];
        var k = 0;
        while (configs[k]) {
            var config = configs[k];
            if (!config.name) {
                throw new Error("State config object missing 'name' property");
            }
            configs.push.apply(configs, (config.states || []));
            k += 1;
        }
        var states = [];
        configs.forEach(function (config) {
            var s = new State(config.name, {
                documentOrder: documentOrder.get(),
                initial: !!config.initial,
                parallel: !!config.parallel,
                final: !!config.final
            });
            states.push(config, s);
            if (!rootState)
                rootState = s;
        });
        configs.forEach(function (config) {
            var s = states[states.indexOf(config) + 1];
            (config.states || []).forEach(function (childConfig) {
                var childState = states[states.indexOf(childConfig) + 1];
                s.addChild(childState);
            });
        });
        configs.forEach(function (config) {
            var s = states[states.indexOf(config) + 1];
            (config.transitions || []).forEach(function (transitionConfig) {
                var targetNames = transitionConfig.target.split(',').map(function (x) { return x.trim(); });
                var targets = targetNames.map(function (targetName) {
                    var target = resolveState(s, targetName);
                    if (!target) {
                        throw new Error("Transition target cannot be found '" + targetName + "'");
                    }
                    return target;
                });
                documentOrder.incr();
                s.addTransition(new Transition(transitionConfig.event, targets, { documentOrder: documentOrder.get() }));
            });
        });
        return rootState;
    };
    Object.defineProperty(State.prototype, "isAtomic", {
        get: function () { return isAtomicState(this); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(State.prototype, "name", {
        get: function () { return this._name; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(State.prototype, "id", {
        get: function () {
            var path = [];
            /** @type {State} */
            var s = this;
            while (s) {
                path.push(s.name);
                s = s.parent;
            }
            return path.reverse().join('.');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(State.prototype, "documentOrder", {
        get: function () { return this._documentOrder; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(State.prototype, "parent", {
        get: function () { return this._parent; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(State.prototype, "states", {
        get: function () { return this._states.slice(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(State.prototype, "transitions", {
        get: function () { return this._transitions.slice(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(State.prototype, "initial", {
        get: function () {
            var array = this.states.filter(function (state) { return state._initial; });
            return array.length === 0 ? [this._states[0]] : array;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(State.prototype, "final", {
        get: function () { return this._final; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(State.prototype, "parallel", {
        get: function () { return this._parallel; },
        enumerable: true,
        configurable: true
    });
    /**
     *
     * @param {Transition} transition
     */
    State.prototype.addTransition = function (transition) {
        if (transition._source) {
            throw new Error('Transition already added');
        }
        transition._source = this;
        this._transitions.push(transition);
    };
    /** @param {State} state */
    State.prototype.addChild = function (state) {
        if (state.parent) {
            throw new Error('State already is a child: ' + state.id);
        }
        state._parent = this;
        this._states.push(state);
    };
    return State;
}());
exports.State = State;
/** @param {State} state */
var isFinalState = function (state) { return state.final; };
/** @param {State} state */
var isAtomicState = function (state) { return !isCompoundState(state) && !isParallelState(state); };
/** @param {State} state */
var isCompoundState = function (state) { return !isParallelState(state) && getChildStates(state).length > 0; };
/** @param {State} state */
var isParallelState = function (state) { return state.parallel; };
/** @param {State} state */
var isSCXMLElement = function (state) { return !state.parent; };
/** @param {string} event */
var isCancelEvent = function (event) { return event === 'cancel.machine'; };
/** @param {State} state */
var getChildStates = function (state) { return state.states; };
function buildRegExp(string) {
    if (string === '*')
        return new RegExp("[^.]+(\\.[^.]+)*");
    // Replace any regex special character
    string = string.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&')
        // Replace ^*. and ^.
        .replace(/^\\\*\\\.|^\\\./, "([^.]+\\.)*")
        // Replace .*$ and .$
        .replace(/\\\.\\\*$|\\\.$/, '(\\.[^.]+)*')
        // Replace .*.
        .replace(/\\\.\\\*\\\./g, '\\.([^.]+\\.)*');
    return new RegExp('^' + string);
}
/**
 * Match a transition event pattern(s) to an event.
 *
 * Transition event patterns can be:
 *
 * PATTERN            MATCHES EVENTS LIKE
 * '*'                anything, foo.event, something
 * .foo               foo, something.foo
 * *.foo              foo, something.foo
 * foo                foo
 * foo.               foo, foo.something, foo.something.two
 * foo.*              foo, foo.something, foo.something.two
 * foo.*.Modal        foo.anything.Modal
 * foo.*.Modal.       foo.anything.Modal, foo.anything.something.Modal.Another
 * foo.*.Modal.*      foo.anything.Modal, foo.anything.something.Modal.Another
 * foo.*.One.*.Two    foo.One.Two, foo.anything.One.something.Two
 *
 * @param {string} transitionEvent
 * @param {string} event
 */
var nameMatch = function (transitionEvent, event) {
    var tEvents = transitionEvent.split(' ');
    return tEvents.some(function (tEvent) {
        if (tEvent === '*')
            return true;
        var regex = buildRegExp(tEvent);
        return regex.test(event);
    });
};
var documentOrder = function (a, b) { return a.documentOrder - b.documentOrder; };
var entryOrder = function (a, b) { return a.documentOrder - b.documentOrder; };
var exitOrder = function (a, b) { return b.documentOrder - a.documentOrder; };
var nextTick = function (fn) {
    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(fn);
    }
    else if (typeof process === 'object') {
        process.nextTick(fn);
    }
    else {
        setTimeout(fn, 16.333);
    }
};
var Interpreter = /** @class */ (function () {
    /**
     * @param {State} rootState
     */
    function Interpreter(rootState) {
        var _this = this;
        this.rootState = rootState;
        /** @type {{ type: string, listener: Function }[]} */
        this._listeners = [];
        this._running = false;
        this.configuration = new OrderedSet();
        this.internalQueue = new Queue();
        this.externalQueue = new Queue();
        this._running = false;
        // Emit an event that invokes registered listeners
        this._emit = function (eventType) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            _this._listeners.filter(function (reg) {
                return reg.type === eventType;
            }).forEach(function (reg) {
                reg.listener.apply(reg, args);
            });
        };
        this.send = this.send.bind(this);
        this.matches = this.matches.bind(this);
    }
    Object.defineProperty(Interpreter.prototype, "running", {
        get: function () { return this._running; },
        enumerable: true,
        configurable: true
    });
    Interpreter.prototype.onEntry = function (listener) {
        var _this = this;
        this._listeners.push({ type: 'entry', listener: listener });
        return function () {
            if (listener) {
                _this._listeners.splice(_this._listeners.indexOf(listener), 1);
                listener = null;
            }
        };
    };
    Interpreter.prototype.onExit = function (listener) {
        var _this = this;
        this._listeners.push({ type: 'exit', listener: listener });
        return function () {
            if (listener) {
                _this._listeners.splice(_this._listeners.indexOf(listener), 1);
                listener = null;
            }
        };
    };
    Interpreter.prototype.onTransition = function (listener) {
        var _this = this;
        this._listeners.push({ type: 'transition', listener: listener });
        return function () {
            if (listener) {
                _this._listeners.splice(_this._listeners.indexOf(listener), 1);
                listener = null;
            }
        };
    };
    Interpreter.prototype.onEvent = function (listener) {
        var _this = this;
        this._listeners.push({ type: 'event', listener: listener });
        return function () {
            if (listener) {
                _this._listeners.splice(_this._listeners.indexOf(listener), 1);
                listener = null;
            }
        };
    };
    Interpreter.prototype.onDone = function (listener) {
        var _this = this;
        this._listeners.push({ type: 'done', listener: listener });
        return function () {
            if (listener) {
                _this._listeners.splice(_this._listeners.indexOf(listener), 1);
                listener = null;
            }
        };
    };
    Interpreter.prototype.start = function () {
        if (this.running)
            return;
        this._running = true;
        var t = new Transition('', this.rootState.initial);
        t._source = this.rootState;
        this.enterStates([t]);
        this.mainEventLoop();
    };
    Interpreter.prototype.stop = function () {
        this.send('machine.cancel');
    };
    Interpreter.prototype.send = function (event) {
        if (!this.running)
            return;
        this.externalQueue.enqueue(event);
    };
    Interpreter.prototype.matches = function (stateDescriptor) {
        var regexp = buildRegExp(stateDescriptor);
        var atomic = this.configuration.toArray().filter(isAtomicState);
        return atomic.some(function (state) {
            var id = state.id;
            return regexp.test(id);
        });
    };
    /** @param {State[]} states */
    Interpreter.prototype.setConfiguration = function (states) {
        this.internalQueue.enqueue({ type: 'machine.configure', states: states });
    };
    /// //////////////////
    // PRIVATE METHODS //
    /// //////////////////
    Interpreter.prototype.mainEventLoop = function () {
        var _this = this;
        this.processInternalEvents();
        this.processNextExternalEvent();
        if (this.running) {
            nextTick(function () {
                _this.mainEventLoop();
            });
        }
        else {
            this.exitInterpreter();
        }
    };
    Interpreter.prototype.processInternalEvents = function () {
        /** @type {OrderedSet} */
        var enabledTransitions = null;
        var macrostepDone = false;
        // Here we handle eventless transitions and transitions
        // triggered by internal events until macrostep is complete
        while (this.running && !macrostepDone) {
            if (this.internalQueue.isEmpty) {
                macrostepDone = true;
            }
            else {
                /** @type {{ type: string, [key:string]: any }} */
                var internalEvent = this.internalQueue.dequeue();
                enabledTransitions = this.selectTransitions(internalEvent);
            }
            if (enabledTransitions && !enabledTransitions.isEmpty) {
                this.microstep(enabledTransitions.toArray());
                enabledTransitions = null;
            }
        }
    };
    Interpreter.prototype.processNextExternalEvent = function () {
        if (this.externalQueue.isEmpty || !this.running)
            return;
        var externalEvent = this.externalQueue.dequeue();
        this._emit('event', { event: externalEvent, service: this });
        if (isCancelEvent(externalEvent)) {
            this._running = false;
            return;
        }
        var enabledTransitions = this.selectTransitions({ type: externalEvent });
        if (!enabledTransitions.isEmpty) {
            this.microstep(enabledTransitions.toArray());
        }
    };
    /**
     *
     * @param {State} state
     * @return {boolean}
     */
    Interpreter.prototype.isInFinalState = function (state) {
        var _this = this;
        if (isCompoundState(state)) {
            return getChildStates(state).some(function (s) { return isFinalState(s) && _this.configuration.isMember(s); });
        }
        else if (isParallelState(state)) {
            return getChildStates(state).every(function (s) { return _this.isInFinalState(s); });
        }
        else {
            return false;
        }
    };
    /**
     *
     * @param {Transition[]} enabledTransitions
     */
    Interpreter.prototype.enterStates = function (enabledTransitions) {
        var _this = this;
        var service = this;
        var statesToEnter = new OrderedSet();
        computeEntrySet(enabledTransitions, statesToEnter);
        for (var _i = 0, _a = statesToEnter.toArray().sort(entryOrder); _i < _a.length; _i++) {
            var s = _a[_i];
            this.configuration.add(s);
            this._emit('entry', { state: s, service: service });
            if (isFinalState(s)) {
                if (isSCXMLElement(s.parent)) {
                    this._running = false;
                }
                else {
                    var parent_1 = s.parent;
                    var grandparent = parent_1.parent;
                    this.internalQueue.enqueue({ type: 'done.state.' + parent_1.id });
                    if (isParallelState(grandparent)) {
                        if (getChildStates(grandparent).every(function (s) { return _this.isInFinalState(s); })) {
                            this.internalQueue.enqueue({ type: 'done.state.' + grandparent.id });
                        }
                    }
                }
            }
        }
        this._emit('transition', { service: this });
    };
    /**
     *
     * @param {Transition[]} transitions
     * @return {OrderedSet}
     */
    Interpreter.prototype.computeExitSet = function (transitions) {
        var statesToExit = new OrderedSet();
        for (var _i = 0, transitions_1 = transitions; _i < transitions_1.length; _i++) {
            var t = transitions_1[_i];
            if (t.target.length) {
                var domain = getTransitionDomain(t);
                for (var _a = 0, _b = this.configuration.toArray(); _a < _b.length; _a++) {
                    var s = _b[_a];
                    if (isDescendant(s, domain)) {
                        statesToExit.add(s);
                    }
                }
            }
        }
        return statesToExit;
    };
    /**
     *
     * @param {Transition[]} enabledTransitions
     */
    Interpreter.prototype.exitStates = function (enabledTransitions) {
        var statesToExit = this.computeExitSet(enabledTransitions);
        var service = this;
        for (var _i = 0, _a = statesToExit.toArray().sort(exitOrder); _i < _a.length; _i++) {
            var s = _a[_i];
            this.configuration.delete(s);
            this._emit('exit', { state: s, service: service });
        }
    };
    /**
     *
     * @param {Transition[]} enabledTransitions
     */
    Interpreter.prototype.microstep = function (enabledTransitions) {
        this.exitStates(enabledTransitions);
        this.enterStates(enabledTransitions);
    };
    /**
     *
     * @param {OrderedSet} enabledTransitions
     * @return {OrderedSet}
     */
    Interpreter.prototype.removeConflictingTransitions = function (enabledTransitions) {
        var filteredTransitions = new OrderedSet();
        for (var _i = 0, _a = enabledTransitions.toArray(); _i < _a.length; _i++) {
            var t1 = _a[_i];
            var t1Preempted = false;
            var transitionsToRemove = new OrderedSet();
            for (var _b = 0, _c = filteredTransitions.toArray(); _b < _c.length; _b++) {
                var t2 = _c[_b];
                if (this.computeExitSet([t1]).hasIntersection(this.computeExitSet([t2]))) {
                    if (isDescendant(t1.source, t2.source)) {
                        transitionsToRemove.add(t2);
                    }
                    else {
                        t1Preempted = true;
                        break;
                    }
                }
            }
            if (!t1Preempted) {
                for (var _d = 0, _e = transitionsToRemove.toArray(); _d < _e.length; _d++) {
                    var t3 = _e[_d];
                    filteredTransitions.delete(t3);
                }
                filteredTransitions.add(t1);
            }
        }
        return filteredTransitions;
    };
    /**
     *
     * @param {{ type: string, [key: string]: any }} event
     * @return {OrderedSet}
     */
    Interpreter.prototype.selectTransitions = function (event) {
        var enabledTransitions = new OrderedSet();
        if (event.type === 'machine.configure') {
            var t = new Transition('', event.states);
            t._source = this.rootState;
            enabledTransitions.add(t);
        }
        else {
            var atomicStates = this.configuration.toArray().filter(isAtomicState).sort(documentOrder);
            for (var _i = 0, atomicStates_1 = atomicStates; _i < atomicStates_1.length; _i++) {
                var state = atomicStates_1[_i];
                var loop = true;
                for (var _a = 0, _b = [state].concat(getProperAncestors(state, null)); _a < _b.length; _a++) {
                    var s = _b[_a];
                    if (!loop)
                        break;
                    for (var _c = 0, _d = s.transitions.sort(documentOrder); _c < _d.length; _c++) {
                        var t = _d[_c];
                        if (t.event && nameMatch(t.event, event.type)) {
                            enabledTransitions.add(t);
                            loop = false;
                            break;
                        }
                    }
                }
            }
        }
        enabledTransitions = this.removeConflictingTransitions(enabledTransitions);
        return enabledTransitions;
    };
    Interpreter.prototype.exitInterpreter = function () {
        var statesToExit = this.configuration.toArray().sort(exitOrder);
        var service = this;
        for (var _i = 0, statesToExit_1 = statesToExit; _i < statesToExit_1.length; _i++) {
            var s = statesToExit_1[_i];
            this.configuration.delete(s);
            if (isFinalState(s) && isSCXMLElement(s.parent)) {
                this._emit('done', { service: service });
            }
        }
    };
    return Interpreter;
}());
exports.Interpreter = Interpreter;
/**
 * @param {State} childState
 * @param {State} parentState
 */
function isDescendant(childState, parentState) {
    var childStates = getChildStates(parentState);
    if (childStates.find(function (state) { return state === childState; })) {
        return true;
    }
    else {
        return childStates.some(function (s) { return isDescendant(childState, s); });
    }
}
/**
 *
 * @param {State} state1
 * @param {State} state2
 * @return {State[]}
 */
function getProperAncestors(state1, state2) {
    var ancestors = [];
    var s = state1;
    while (s) {
        if (isSCXMLElement(s)) {
            ancestors.push(s);
        }
        else if (s.parent) {
            ancestors.push(s.parent);
        }
        s = s.parent;
    }
    if (!state2)
        return ancestors;
    if (state1.parent === state2 || state1 === state2 || isDescendant(state2, state1))
        return [];
    var k = ancestors.findIndex(function (s) { return s === state2; });
    if (k > 0)
        return ancestors.slice(0, k);
    return ancestors;
}
/**
 *
 * @param {Transition} transition
 * @return {OrderedSet}
 */
function getEffectiveTargetStates(transition) {
    var targets = new OrderedSet();
    transition.target.forEach(function (target) { return targets.add(target); });
    return targets;
}
/**
 *
 * @param {State[]} stateList
 * @return {State}
 */
function findLCCA(stateList) {
    var head = stateList[0];
    var tail = stateList.slice(1);
    var _loop_1 = function (anc) {
        if (tail.every(function (s) { return isDescendant(s, anc); })) {
            return { value: anc };
        }
    };
    for (var _i = 0, _a = getProperAncestors(head, null).filter(function (s) { return isCompoundState(s) || isSCXMLElement(s); }); _i < _a.length; _i++) {
        var anc = _a[_i];
        var state_1 = _loop_1(anc);
        if (typeof state_1 === "object")
            return state_1.value;
    }
    return null;
}
/**
 *
 * @param {Transition} transition
 * @return {State}
 */
function getTransitionDomain(transition) {
    var tstates = getEffectiveTargetStates(transition);
    if (!tstates) {
        return null;
    }
    else if (transition.type === 'internal' && getChildStates(transition.source).length && tstates.every(function (s) { return isDescendant(s, transition.source); })) {
        return transition.source;
    }
    else {
        return findLCCA([transition.source].concat(tstates.toArray()));
    }
}
/**
 *
 * @param {State} state
 * @param {State} ancestor
 * @param {OrderedSet} statesToEnter
 */
function addAncestorStatesToEnter(state, ancestor, statesToEnter) {
    for (var _i = 0, _a = getProperAncestors(state, ancestor); _i < _a.length; _i++) {
        var anc = _a[_i];
        statesToEnter.add(anc);
        if (isParallelState(anc)) {
            var _loop_2 = function (child) {
                if (!statesToEnter.some(function (s) { return isDescendant(s, child); })) {
                    addDescendantStatesToEnter(child, statesToEnter);
                }
            };
            for (var _b = 0, _c = getChildStates(anc); _b < _c.length; _b++) {
                var child = _c[_b];
                _loop_2(child);
            }
        }
    }
}
/**
 *
 * @param {State} state
 * @param {OrderedSet} statesToEnter
 */
function addDescendantStatesToEnter(state, statesToEnter) {
    statesToEnter.add(state);
    if (isCompoundState(state)) {
        for (var _i = 0, _a = state.initial; _i < _a.length; _i++) {
            var s = _a[_i];
            addDescendantStatesToEnter(s, statesToEnter);
        }
        for (var _b = 0, _c = state.initial; _b < _c.length; _b++) {
            var s = _c[_b];
            addAncestorStatesToEnter(s, state, statesToEnter);
        }
    }
    else {
        if (isParallelState(state)) {
            var _loop_3 = function (child) {
                if (!statesToEnter.some(function (s) { return isDescendant(s, child); })) {
                    addDescendantStatesToEnter(child, statesToEnter);
                }
            };
            for (var _d = 0, _e = getChildStates(state); _d < _e.length; _d++) {
                var child = _e[_d];
                _loop_3(child);
            }
        }
    }
}
/**
 *
 * @param {Transition[]} transitions
 * @param {OrderedSet} statesToEnter
 */
function computeEntrySet(transitions, statesToEnter) {
    for (var _i = 0, transitions_2 = transitions; _i < transitions_2.length; _i++) {
        var t = transitions_2[_i];
        for (var _a = 0, _b = t.target; _a < _b.length; _a++) {
            var s = _b[_a];
            addDescendantStatesToEnter(s, statesToEnter);
        }
        var ancestor = getTransitionDomain(t);
        for (var _c = 0, _d = getEffectiveTargetStates(t).toArray(); _c < _d.length; _c++) {
            var s = _d[_c];
            addAncestorStatesToEnter(s, ancestor, statesToEnter);
        }
    }
}
