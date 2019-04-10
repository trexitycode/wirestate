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
    function Node() {
        /** @type {StateNode} */
        this.parent = null;
        this.type = '';
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
var StateNode = /** @class */ (function (_super) {
    __extends(StateNode, _super);
    function StateNode() {
        var _this = _super.call(this) || this;
        _this.type = 'state';
        _this.name = '';
        _this.initial = false;
        _this.final = false;
        _this.parallel = false;
        _this.stateType = '';
        _this.indent = 0;
        /** @type {Array<StateNode>} */
        _this.states = [];
        /** @type {TransitionNode[]} */
        _this.transitions = [];
        return _this;
    }
    Object.defineProperty(StateNode.prototype, "id", {
        get: function () {
            var path = [];
            /** @type {StateNode} */
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
    StateNode.prototype.clone = function () {
        var inst = _super.prototype.clone.call(this);
        inst.states = this.states.map(function (state) { return state.clone(); });
        inst.states.forEach(function (state) { return (state.parent = inst); });
        inst.transitions = this.transitions.map(function (transition) { return transition.clone(); });
        inst.transitions.forEach(function (transition) { return (transition.parent = inst); });
        return inst;
    };
    return StateNode;
}(Node));
exports.StateNode = StateNode;
var TransitionNode = /** @class */ (function (_super) {
    __extends(TransitionNode, _super);
    function TransitionNode() {
        var _this = _super.call(this) || this;
        _this.type = 'transition';
        _this.event = '';
        _this.target = '';
        return _this;
    }
    return TransitionNode;
}(Node));
exports.TransitionNode = TransitionNode;
var DirectiveNode = /** @class */ (function (_super) {
    __extends(DirectiveNode, _super);
    function DirectiveNode() {
        var _this = _super.call(this) || this;
        _this.type = 'directive';
        _this.directiveType = '';
        return _this;
    }
    return DirectiveNode;
}(Node));
exports.DirectiveNode = DirectiveNode;
var IncludeDirectiveNode = /** @class */ (function (_super) {
    __extends(IncludeDirectiveNode, _super);
    function IncludeDirectiveNode() {
        var _this = _super.call(this) || this;
        _this.directiveType = '@include';
        _this.fileName = '';
        return _this;
    }
    return IncludeDirectiveNode;
}(DirectiveNode));
exports.IncludeDirectiveNode = IncludeDirectiveNode;
/**
 * Breadth-first walk of an AST graph. Calls visit for each AST node.
 * @param {Node} node
 * @param {Function} visit
 */
exports.walk = function (node, visit) {
    var stack = [node];
    while (stack.length) {
        var node_1 = stack.shift();
        if (node_1 instanceof StateNode) {
            visit(node_1);
            node_1.transitions.forEach(function (t) { return visit(t); });
            stack.push.apply(stack, node_1.states);
        }
        else if (node_1.type === 'directive') {
            visit(node_1);
        }
    }
};
/**
 * @param {TransitionNode} transitionNode
 * @return {StateNode}
 */
exports.resolveState = function (transitionNode) {
    /** @param {StateNode} stateNode */
    var enumerateStates = function (stateNode) {
        /** @type {StateNode[]} */
        var states = [];
        var s = stateNode;
        while (s) {
            states = states.concat(s.states);
            if (!s.parent)
                states.push(s);
            s = s.parent;
        }
        return states;
    };
    var statesToSearch = enumerateStates(transitionNode.parent);
    var target = transitionNode.target;
    while (statesToSearch.length) {
        var stateNode = statesToSearch.shift();
        var matchingStateNode = stateNode.states.find(function (child) { return child.name === target; });
        if (matchingStateNode) {
            return matchingStateNode;
        }
    }
    return null;
};
