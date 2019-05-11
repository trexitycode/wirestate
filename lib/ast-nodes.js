"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Node = /** @class */ (function () {
    /**
     * @param {string} type
     */
    function Node(type) {
        /** @type {Node} */
        this.parent = null;
        this.type = type;
        this.line = 1;
        this.column = 0;
    }
    Node.prototype.clone = function () {
        // @ts-ignore
        var inst = new this.constructor();
        Object.assign(inst, this);
        return inst;
    };
    return Node;
}());
exports.Node = Node;
var ScopeNode = /** @class */ (function (_super) {
    __extends(ScopeNode, _super);
    function ScopeNode() {
        var _this = _super.call(this, 'scope') || this;
        _this.imports = [];
        _this.machines = [];
        return _this;
    }
    ScopeNode.prototype.clone = function () {
        var inst = _super.prototype.clone.call(this);
        inst.imports = this.imports.map(function (n) { return n.clone(); });
        inst.imports.forEach(function (n) { return (n.parent = inst); });
        inst.machines = this.machines.map(function (n) { return n.clone(); });
        inst.machines.forEach(function (n) { return (n.parent = inst); });
    };
    return ScopeNode;
}(Node));
exports.ScopeNode = ScopeNode;
var ImportNode = /** @class */ (function (_super) {
    __extends(ImportNode, _super);
    /**
     * @param {string[]} machineIds
     * @param {string} file
     */
    function ImportNode(machineIds, file) {
        var _this = _super.call(this, 'import') || this;
        _this.machineIds = machineIds.slice();
        _this.file = file;
        return _this;
    }
    ImportNode.prototype.clone = function () {
        var inst = _super.prototype.clone.call(this);
        inst.machineIds = this.machineIds.slice();
        return inst;
    };
    return ImportNode;
}(Node));
exports.ImportNode = ImportNode;
var MachineNode = /** @class */ (function (_super) {
    __extends(MachineNode, _super);
    /** @param {string} id */
    function MachineNode(id) {
        var _this = _super.call(this, 'machine') || this;
        _this.id = id;
        _this.indent = 0;
        /** @type {Array<StateNode>} */
        _this.states = [];
        /** @type {TransitionNode[]} */
        _this.transitions = [];
        /** @type {EventProtocolNode[]} */
        _this.eventProtocols = [];
        return _this;
    }
    MachineNode.prototype.clone = function () {
        var inst = _super.prototype.clone.call(this);
        inst.states = this.states.map(function (n) { return n.clone(); });
        inst.states.forEach(function (n) { return (n.parent = inst); });
        inst.transitions = this.transitions.map(function (n) { return n.clone(); });
        inst.transitions.forEach(function (n) { return (n.parent = inst); });
        inst.eventProtocols = this.eventProtocols.map(function (n) { return n.clone(); });
        inst.eventProtocols.forEach(function (n) { return (n.parent = inst); });
        return inst;
    };
    return MachineNode;
}(Node));
exports.MachineNode = MachineNode;
var EventProtocolNode = /** @class */ (function (_super) {
    __extends(EventProtocolNode, _super);
    /** @param {string} event */
    function EventProtocolNode(event) {
        var _this = _super.call(this, 'eventProtocol') || this;
        _this.event = event;
        return _this;
    }
    return EventProtocolNode;
}(Node));
exports.EventProtocolNode = EventProtocolNode;
var StateNode = /** @class */ (function (_super) {
    __extends(StateNode, _super);
    /**
     * @param {string} id
     * @param {number} indent
     */
    function StateNode(id, indent) {
        var _this = _super.call(this, 'state') || this;
        _this.id = id;
        _this.initial = false;
        _this.final = false;
        _this.parallel = false;
        _this.stateType = 'atomic';
        _this.indent = indent;
        /** @type {Array<StateNode>} */
        _this.states = [];
        /** @type {TransitionNode[]} */
        _this.transitions = [];
        /** @type {EventProtocolNode[]} */
        _this.eventProtocols = [];
        return _this;
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
    StateNode.prototype.clone = function () {
        var inst = _super.prototype.clone.call(this);
        inst.states = this.states.map(function (n) { return n.clone(); });
        inst.states.forEach(function (n) { return (n.parent = inst); });
        inst.transitions = this.transitions.map(function (n) { return n.clone(); });
        inst.transitions.forEach(function (n) { return (n.parent = inst); });
        inst.eventProtocols = this.eventProtocols.map(function (n) { return n.clone(); });
        inst.eventProtocols.forEach(function (n) { return (n.parent = inst); });
        return inst;
    };
    return StateNode;
}(Node));
exports.StateNode = StateNode;
var TransitionNode = /** @class */ (function (_super) {
    __extends(TransitionNode, _super);
    /**
     * @param {string} event
     * @param {string} target
     */
    function TransitionNode(event, target) {
        var _this = _super.call(this, 'transition') || this;
        _this.event = event;
        _this.target = target;
        return _this;
    }
    return TransitionNode;
}(Node));
exports.TransitionNode = TransitionNode;
var DirectiveNode = /** @class */ (function (_super) {
    __extends(DirectiveNode, _super);
    /**
     * @param {string} directiveType
     */
    function DirectiveNode(directiveType) {
        var _this = _super.call(this, 'directive') || this;
        _this.directiveType = directiveType;
        return _this;
    }
    return DirectiveNode;
}(Node));
exports.DirectiveNode = DirectiveNode;
var UseDirectiveNode = /** @class */ (function (_super) {
    __extends(UseDirectiveNode, _super);
    /**
     * @param {string} machineId
     */
    function UseDirectiveNode(machineId) {
        var _this = _super.call(this, '@user') || this;
        _this.machineId = machineId;
        return _this;
    }
    return UseDirectiveNode;
}(DirectiveNode));
exports.UseDirectiveNode = UseDirectiveNode;
/**
 * Breadth-first walk of an AST graph. Calls visit for each AST node.
 * @param {Node} node
 * @param {Function} visit
 */
exports.walk = function (node, visit) {
    var stack = [node];
    while (stack.length) {
        var node_1 = stack.shift();
        if (node_1 instanceof ScopeNode) {
            visit(node_1);
            stack.push.apply(stack, node_1.imports);
            stack.push.apply(stack, node_1.machines);
        }
        else if (node_1 instanceof StateNode) {
            visit(node_1);
            node_1.transitions.forEach(function (t) { return visit(t); });
            node_1.eventProtocols.forEach(function (t) { return visit(t); });
            stack.push.apply(stack, node_1.states);
        }
        else if (node_1 instanceof MachineNode) {
            visit(node_1);
            node_1.transitions.forEach(function (t) { return visit(t); });
            node_1.eventProtocols.forEach(function (t) { return visit(t); });
            stack.push.apply(stack, node_1.states);
        }
        else {
            visit(node_1);
        }
    }
};
/**
 * @param {TransitionNode} transitionNode
 * @return {StateNode}
 */
exports.resolveState = function (transitionNode) {
    /** @param {any} stateNode */
    var enumerateStates = function (stateNode) {
        /** @type {StateNode[]} */
        var states = [];
        var s = stateNode;
        while (s) {
            states = states.concat(s.states);
            if (!s.parent)
                states.push(s);
            // @ts-ignore
            s = s.parent;
        }
        return states;
    };
    // TODO: Needs to be refactored so that ALL states in the machine
    // are searched
    var statesToSearch = transitionNode.parent instanceof MachineNode
        ? []
        : enumerateStates(transitionNode.parent);
    var target = transitionNode.target;
    while (statesToSearch.length) {
        var stateNode = statesToSearch.shift();
        var matchingStateNode = stateNode.states.find(function (child) { return child.id === target; });
        if (matchingStateNode) {
            return matchingStateNode;
        }
    }
    return null;
};
//# sourceMappingURL=ast-nodes.js.map