"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var FS = require("fs");
var Path = require("path");
var util_1 = require("util");
var tokenizer_1 = require("./tokenizer");
var parser_1 = require("./parser");
var ast_nodes_1 = require("./ast-nodes");
var readFile = util_1.promisify(FS.readFile);
var analyze = function (stateNode, _a) {
    var _b = (_a === void 0 ? {} : _a).fileName, fileName = _b === void 0 ? '' : _b;
    return __awaiter(_this, void 0, void 0, function () {
        var allStateNodes, allTransitionNodes, statesMap, tokenizer, parser, deferredStates;
        var _this = this;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    // Make deep copy
                    stateNode = stateNode.clone();
                    allStateNodes = [];
                    allTransitionNodes = [];
                    ast_nodes_1.walk(stateNode, function (node) {
                        if (node.type === 'state') {
                            allStateNodes.push(node);
                        }
                        if (node.type === 'transition') {
                            allTransitionNodes.push(node);
                        }
                    });
                    statesMap = Object.create(null);
                    allStateNodes.forEach(function (stateNode) {
                        if (stateNode.id in statesMap) {
                            throw new Error("SemanticError: State already exists: \"" + stateNode.name + "\" with ID: " + stateNode.id);
                        }
                    });
                    // Transient states cannot have child states
                    allStateNodes.filter(function (node) { return node.stateType === 'transient'; }).forEach(function (node) {
                        if (node.states.length !== 0) {
                            throw new Error("SemanticError: Transient states cannot have child states: \"" + node.name + "\"");
                        }
                    });
                    // For atomic states that have child states, set their stateType to "compound"
                    allStateNodes.filter(function (node) { return node.stateType === 'atomic'; }).forEach(function (node) {
                        if (node.states.length) {
                            node.stateType = 'compound';
                        }
                    });
                    // Verify there is only one initial child state for all compound states
                    ast_nodes_1.walk(stateNode, function (node) {
                        if (node.stateType === 'compound' && node.states.filter(function (n) { return n.initial; }).length > 1) {
                            throw new Error("SemanticError: Only one child state can be marked as initial: \"" + node.name + "\"");
                        }
                    });
                    // If no child state is set to be initial then, set first child state to be initial
                    ast_nodes_1.walk(stateNode, function (node) {
                        if (node.stateType === 'compound' && node.states.filter(function (n) { return n.initial; }).length === 0) {
                            node.states[0].initial = true;
                        }
                    });
                    tokenizer = tokenizer_1.makeTokenizer();
                    parser = parser_1.makeParser();
                    deferredStates = allStateNodes
                        .filter(function (node) { return node.states.some(function (n) { return n.directiveType === '@include'; }); });
                    return [4 /*yield*/, deferredStates
                            // Get all state nodes with an @include directive in their states array
                            .filter(function (node) { return node.states.some(function (n) { return n.directiveType === '@include'; }); })
                            // For each node that has an @include directive we create a task that
                            // will asynchronously load the the file referenced by the directive
                            // then tokenize, parse and prefix all state node IDs.
                            .map(function (parentNode) { return function () { return __awaiter(_this, void 0, void 0, function () {
                            var includeNodes;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        includeNodes = parentNode.states.filter(function (n) { return n.directiveType === '@include'; });
                                        return [4 /*yield*/, includeNodes.map(function (includeNode) { return function () { return __awaiter(_this, void 0, void 0, function () {
                                                var fileNameToInclude, text, includedRootNode, tokens, rootName, error_1, nodeToInsert;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            fileNameToInclude = Path.resolve(Path.dirname(fileName), includeNode.fileName);
                                                            return [4 /*yield*/, readFile(fileNameToInclude, 'utf8')];
                                                        case 1:
                                                            text = _a.sent();
                                                            includedRootNode = null;
                                                            _a.label = 2;
                                                        case 2:
                                                            _a.trys.push([2, 4, , 5]);
                                                            tokens = tokenizer.tokenize(text);
                                                            rootName = Path.basename(fileNameToInclude, Path.extname(fileNameToInclude));
                                                            includedRootNode = parser.parse(tokens, rootName);
                                                            return [4 /*yield*/, analyze(includedRootNode, { fileName: fileNameToInclude })];
                                                        case 3:
                                                            includedRootNode = _a.sent();
                                                            return [3 /*break*/, 5];
                                                        case 4:
                                                            error_1 = _a.sent();
                                                            throw Object.assign(new Error("(FILE:" + includeNode.fileName + ")::" + error_1.message), error_1);
                                                        case 5:
                                                            nodeToInsert = (includedRootNode.transitions.length === 0 &&
                                                                includedRootNode.states.length === 1) ? includedRootNode.states[0]
                                                                : includedRootNode;
                                                            nodeToInsert.initial = includeNode.initial;
                                                            nodeToInsert.parent = parentNode;
                                                            // Replace the directive node in the parent node
                                                            parentNode.states.splice(parentNode.states.indexOf(includeNode), 1, nodeToInsert);
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); }; }).reduce(function (p, task) { return p.then(task); }, Promise.resolve())
                                            // Run each task that handles directives sequentially
                                        ];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }; }).reduce(function (p, task) { return p.then(task); }, Promise.resolve())
                        // Re-scan all sate nodes after directives have been processed
                    ];
                case 1:
                    _c.sent();
                    // Re-scan all sate nodes after directives have been processed
                    allStateNodes = [];
                    ast_nodes_1.walk(stateNode, function (node) {
                        if (node.type === 'state') {
                            allStateNodes.push(node);
                        }
                    });
                    // Verify transtion targets from THIS statechart refer to existing state IDs
                    // in deferred statecharts and ourselves.
                    allTransitionNodes
                        .filter(function (node) { return !node.target.startsWith('done.state.'); })
                        .forEach(function (node) {
                        if (!ast_nodes_1.resolveState(node)) {
                            throw new Error("SemanticError: Transition target not found \"" + node.target + "\"");
                        }
                    });
                    return [2 /*return*/, stateNode];
            }
        });
    });
};
exports.makeAnalyzer = function () {
    return { analyze: analyze };
};
