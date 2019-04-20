"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var PropTypes = require("prop-types");
var noop = function () { };
exports.WireStateContext = React.createContext({
    configuration: [],
    send: null,
    matches: null,
    service: null
});
exports.WireStateApp = function (_a) {
    var children = _a.children, service = _a.service, onStart = _a.onStart, _b = _a.context, context = _b === void 0 ? {} : _b;
    var _c = React.useState(function () {
        return {
            configuration: [],
            service: service,
            send: service.send,
            matches: service.matches
        };
    }), state = _c[0], setState = _c[1];
    React.useEffect(function () {
        var subscriptions = [
            service.onTransition(function () {
                setState(__assign({}, context, state, { configuration: service.configuration.toArray() }));
            })
        ].filter(Boolean);
        // Calling start multiple times has no effect. Just the first
        // call to start will start the interpreter.
        service.start();
        if (typeof onStart === 'function') {
            onStart();
        }
        return function () {
            while (subscriptions.length) {
                subscriptions.pop()();
            }
        };
    });
    return (React.createElement(exports.WireStateContext.Provider, { value: state }, children));
};
exports.WireStateApp.propTypes = {
    service: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired,
    onStart: PropTypes.func,
    context: PropTypes.object
};
exports.WireStateView = function (_a) {
    var state = _a.state, component = _a.component, children = _a.children;
    var Component = component;
    var matches = React.useContext(exports.WireStateContext).matches;
    return matches(state)
        ? (Component ? React.createElement(Component, null) : children)
        : null;
};
exports.WireStateView.propTypes = {
    state: PropTypes.string.isRequired,
    component: PropTypes.elementType,
    children: PropTypes.node
};
exports.WireStateAction = function (_a) {
    var state = _a.state, action = _a.action;
    var ctx = React.useContext(exports.WireStateContext);
    React.useEffect(function () {
        if (ctx.matches(state)) {
            return action(ctx);
        }
    });
    return null;
};
exports.WireStateAction.propTypes = {
    state: PropTypes.string.isRequired,
    action: PropTypes.func.isRequired
};
