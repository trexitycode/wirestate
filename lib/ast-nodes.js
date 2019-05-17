"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Node {
    /**
     * @param {string} type
     */
    constructor(type) {
        if (this.constructor === Node) {
            throw new Error('IllegalOperation: Node is an abstract class');
        }
        /**
         * @protected
         * @type {Node}
         */
        this._parent = null;
        /** @private */
        this._type = type;
        this.line = 1;
        this.column = 0;
    }
    get type() { return this._type; }
    /** @type {Node} */
    get parent() { return this._parent; }
    set parent(value) {
        if (value instanceof Node) {
            this._parent = value;
        }
        else {
            throw new Error('Node parent must be an instance of Node');
        }
    }
    /** @return {this} */
    clone() {
        // @ts-ignore
        return this.constructor.fromJSON(this.toJSON());
    }
    toJSON() {
        return {
            type: this.type,
            line: this.line,
            column: this.column
        };
    }
}
class ScopeNode extends Node {
    static fromJSON(json) {
        let inst = new ScopeNode(json.fileName);
        inst.line = json.line;
        inst.column = json.column;
        inst._machines = json.machines.map(MachineNode.fromJSON);
        inst._machines.forEach(n => (n.parent = inst));
        inst._imports = json.imports.map(ImportNode.fromJSON);
        inst._imports.forEach(n => (n.parent = inst));
        return inst;
    }
    constructor(fileName = '') {
        super('scope');
        this._fileName = fileName;
        /**
         * @private
         * @type {ImportNode[]}
         */
        this._imports = [];
        /**
         * @private
         * @type {MachineNode[]}
         */
        this._machines = [];
    }
    get fileName() { return this._fileName; }
    get imports() { return this._imports; }
    get machines() { return this._machines; }
    set parent(value) {
        throw new Error('ScopeNode cannot have a parent');
    }
    toJSON() {
        let json = super.toJSON();
        json.imports = this._imports.map(n => n.toJSON());
        json.machines = this._machines.map(n => n.toJSON());
        return json;
    }
}
exports.ScopeNode = ScopeNode;
class ImportNode extends Node {
    static fromJSON(json) {
        let inst = new ImportNode(json.machineIds, json.file);
        inst.line = json.line;
        inst.column = json.column;
        // TOOD: Set inst.scopeNode
        return inst;
    }
    /**
     * @param {string[]} machineIds
     * @param {string} file
     */
    constructor(machineIds, file) {
        super('import');
        /** @private */
        this._machineIds = machineIds.slice();
        /** @private */
        this._file = file;
        /** @type {ScopeNode} */
        this.scopeNode = null;
    }
    get file() { return this._file; }
    get machineIds() { return this._machineIds; }
    /** @type {ScopeNode} */
    get parent() {
        // @ts-ignore
        return this._parent;
    }
    set parent(value) {
        if (value instanceof ScopeNode) {
            this._parent = value;
        }
        else {
            throw new Error('ImportNode parent must be an instance of ScopeNode');
        }
    }
    toJSON() {
        let json = super.toJSON();
        json.file = this.file;
        json.machineIds = this.machineIds.slice();
        return json;
    }
}
exports.ImportNode = ImportNode;
class CompoundNode extends Node {
    /**
     * @param {string} type
     * @param {string} id
     */
    constructor(type, id) {
        super(type);
        this.id = id;
        /**
         * @private
         * @type {Array<StateNode>}
         */
        this._states = [];
        /**
         * @private
         * @type {TransitionNode[]}
         */
        this._transitions = [];
        /**
         * @private
         * @type {EventProtocolNode[]}
         */
        this._eventProtocols = [];
    }
    get states() { return this._states; }
    get transitions() { return this._transitions; }
    get eventProtocols() { return this._eventProtocols; }
    toJSON() {
        let json = super.toJSON();
        json.id = this.id;
        json.states = this._states.map(n => n.toJSON());
        json.transitions = this._transitions.map(n => n.toJSON());
        json.eventProtocols = this._eventProtocols.map(n => n.toJSON());
        return json;
    }
}
class MachineNode extends CompoundNode {
    static fromJSON(json) {
        let inst = new MachineNode(json.id);
        inst.line = json.line;
        inst.column = json.column;
        inst._states = json.states.map(StateNode.fromJSON);
        inst._states.forEach(n => (n.parent = inst));
        inst._transitions = json.transitions.map(TransitionNode.fromJSON);
        inst._transitions.forEach(n => (n.parent = inst));
        inst._eventProtocols = json.eventProtocols.map(EventProtocolNode.fromJSON);
        inst._eventProtocols.forEach(n => (n.parent = inst));
        return inst;
    }
    /** @param {string} id */
    constructor(id) {
        super('machine', id);
    }
    /** @type {ScopeNode} */
    get parent() {
        return /** @type {ScopeNode} */ (this._parent);
    }
    set parent(value) {
        if (value instanceof ScopeNode) {
            this._parent = value;
        }
        else {
            throw new Error('MachineNode parent must be an instance of ScopeNode');
        }
    }
}
exports.MachineNode = MachineNode;
class EventProtocolNode extends Node {
    static fromJSON(json) {
        let inst = new EventProtocolNode(json.eventName);
        inst.line = json.line;
        inst.column = json.column;
        return inst;
    }
    /** @param {string} eventName */
    constructor(eventName) {
        super('eventProtocol');
        this.eventName = eventName;
    }
    /** @type {CompoundNode} */
    get parent() {
        return /** @type {CompoundNode} */ (this._parent);
    }
    set parent(value) {
        if (value instanceof CompoundNode) {
            this._parent = value;
        }
        else {
            throw new Error('EventProtocolNode parent must be an instance of MachineNode or StateNode');
        }
    }
    toJSON() {
        let json = super.toJSON();
        json.eventName = this.eventName;
        return json;
    }
}
exports.EventProtocolNode = EventProtocolNode;
class StateNode extends CompoundNode {
    static fromJSON(json) {
        let inst = new StateNode(json.id, json.indent);
        inst.line = json.line;
        inst.column = json.column;
        inst.initial = json.initial;
        inst.stateType = json.stateType;
        inst.parallel = json.parallel;
        inst.final = json.final;
        inst.useDirective = json.useDirective
            ? Object.assign(UseDirectiveNode.fromJSON(json.useDirective), { parent: inst })
            : null;
        inst._states = json.states.map(StateNode.fromJSON);
        inst._states.forEach(n => (n.parent = inst));
        inst._transitions = json.transitions.map(TransitionNode.fromJSON);
        inst._transitions.forEach(n => (n.parent = inst));
        inst._eventProtocols = json.eventProtocols.map(EventProtocolNode.fromJSON);
        inst._eventProtocols.forEach(n => (n.parent = inst));
        return inst;
    }
    /**
     * @param {string} id
     * @param {number} indent
     */
    constructor(id, indent) {
        super('state', id);
        this.initial = false;
        this.final = false;
        this.parallel = false;
        this.stateType = 'atomic';
        this.indent = indent;
        /** @type {UseDirectiveNode} */
        this.useDirective = null;
    }
    /** @type {CompoundNode} */
    get parent() {
        return /** @type {CompoundNode} */ (this._parent);
    }
    set parent(value) {
        if (value instanceof CompoundNode) {
            this._parent = value;
        }
        else {
            throw new Error('StateNode parent must be an instance of MachineNode or StateNode');
        }
    }
    /** @type {ScopeNode} */
    get scopeNode() {
        /** @type {Node} */
        let n = this;
        while (n.parent) {
            if (n.parent instanceof ScopeNode) {
                return n.parent;
            }
            n = n.parent;
        }
        return null;
    }
    /** @type {MachineNode} */
    get machineNode() {
        /** @type {Node} */
        let n = this;
        while (n.parent) {
            if (n.parent instanceof MachineNode) {
                return n.parent;
            }
            n = n.parent;
        }
        return null;
    }
    toJSON() {
        let json = super.toJSON();
        json.stateType = this.stateType;
        json.initial = this.initial;
        json.parallel = this.parallel;
        json.final = this.final;
        json.indent = this.indent;
        return json;
    }
}
exports.StateNode = StateNode;
class TransitionNode extends Node {
    static fromJSON(json) {
        let inst = new TransitionNode(json.event, json.target);
        inst.line = json.line;
        inst.column = json.column;
        return inst;
    }
    /**
     * @param {string} event
     * @param {string} target
     */
    constructor(event, target) {
        super('transition');
        /** @private */
        this._event = event;
        /** @private */
        this._target = target;
    }
    get event() { return this._event; }
    get target() { return this._target; }
    /** @type {CompoundNode} */
    get parent() {
        // @ts-ignore
        return this._parent;
    }
    set parent(value) {
        if (value instanceof CompoundNode) {
            this._parent = value;
        }
        else {
            throw new Error('TransitionNode parent must be an instance of MachineNode or StateNode');
        }
    }
    toJSON() {
        let json = super.toJSON();
        json.event = this.event;
        json.target = this.target;
        return json;
    }
}
exports.TransitionNode = TransitionNode;
class DirectiveNode extends Node {
    /**
     * @param {string} directiveType
     */
    constructor(directiveType) {
        super('directive');
        /** @private */
        this._directiveType = directiveType;
    }
    get directiveType() { return this._directiveType; }
    toJSON() {
        let json = super.toJSON();
        json.directiveType = this.directiveType;
        return json;
    }
}
class UseDirectiveNode extends DirectiveNode {
    static fromJSON(json) {
        let inst = new UseDirectiveNode(json.machineId);
        inst.line = json.line;
        inst.column = json.column;
        return inst;
    }
    /**
     * @param {string} machineId
     */
    constructor(machineId) {
        super('@user');
        /** @private */
        this._machineId = machineId;
    }
    get machineId() { return this._machineId; }
    get machineNode() {
        const scopeNode = this.parent.scopeNode;
        // Attempt to locate the machine from within our immediate scope
        let machineNode = scopeNode.machines.find(machineNode => {
            return machineNode.id === this.machineId;
        });
        // If no machine is found in our immediate scope then we look in our imported scopes
        if (!machineNode) {
            const importNode = scopeNode.imports.find(importNode => {
                return importNode.machineIds.includes(this.machineId);
            });
            if (importNode) {
                machineNode = importNode.scopeNode.machines.find(machineNode => {
                    return machineNode.id === this.machineId;
                });
            }
        }
        return machineNode || null;
    }
    /** @type {StateNode} */
    get parent() {
        // @ts-ignore
        return this._parent;
    }
    set parent(value) {
        if (value instanceof StateNode) {
            this._parent = value;
        }
        else {
            throw new Error('UseDirectiveNode parent must be an instance of StateNode');
        }
    }
    toJSON() {
        let json = super.toJSON();
        json.machineId = this.machineId;
        return json;
    }
}
exports.UseDirectiveNode = UseDirectiveNode;
/**
 * Depth-first walk of an AST graph. Calls visit for each AST node.
 *
 * @param {Node} node
 * @param {(node: Node) => any} visit
 * @return {any}
 */
exports.walk = (node, visit) => {
    let stack = [node];
    let returnValue;
    while (stack.length && returnValue === undefined) {
        const node = stack.shift();
        returnValue = visit(node);
        if (node instanceof ScopeNode) {
            stack.unshift(...node.imports);
            stack.unshift(...node.machines);
        }
        else if (node instanceof StateNode) {
            stack.unshift(...node.transitions);
            stack.unshift(...node.eventProtocols);
            node.useDirective && stack.unshift(node.useDirective);
            stack.unshift(...node.states);
        }
        else if (node instanceof MachineNode) {
            stack.unshift(...node.transitions);
            stack.unshift(...node.eventProtocols);
            stack.unshift(...node.states);
        }
        else if (node instanceof ImportNode) {
            node.scopeNode && stack.unshift(node.scopeNode);
        }
    }
    return returnValue;
};
/**
 * Attempts to resolve a transition's target state ID from the transition node's
 * machine node.
 *
 * @param {TransitionNode} transitionNode The TransitionNode to resolve
 * @return {StateNode} StateNode if target can be resolved, null otherwise.
 */
exports.resolveState = (transitionNode) => {
    /** @type {MachineNode} */
    let machineNode = null;
    machineNode = transitionNode.parent instanceof StateNode
        ? transitionNode.parent.machineNode
        : machineNode;
    machineNode = transitionNode.parent instanceof MachineNode
        ? transitionNode.parent
        : machineNode;
    if (!machineNode) {
        throw new Error('TransitionNode has invalid parent. Expected MachineNode or StateNode.');
    }
    // Search the entire machine for a state who's ID matches our transitionNode target.
    /** @type {StateNode} */
    const stateNode = exports.walk(machineNode, node => {
        if (node instanceof StateNode) {
            if (node.id === transitionNode.target) {
                return node;
            }
        }
    });
    return stateNode || null;
};
//# sourceMappingURL=ast-nodes.js.map