"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tokenizer_1 = require("./tokenizer");
var parser_1 = require("./parser");
var analyzer_1 = require("./analyzer");
var generator_1 = require("./generator");
var state = "\nback -> Exit!\n\nExit!\n\nHome*\n  one -> One?\n  get name -> modal\n\n  @include \"./modal.states\"\n\nOne?\n  is user logged in? -> Seven\n\nSeven";
var tokenizer = tokenizer_1.makeTokenizer();
var tokens = tokenizer.tokenize(state);
var parser = parser_1.makeParser();
var ast = parser.parse(tokens);
var analyzer = analyzer_1.makeAnalyzer();
analyzer.analyze(ast, { fileName: 'file.states' }).then(function (newAst) {
    var generator = generator_1.makeGenerator();
    console.log(generator.generate(newAst, 'xstate-machine-esm'));
});
