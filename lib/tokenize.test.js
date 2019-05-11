"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tokenizer_1 = require("./tokenizer");
var parser_1 = require("./parser");
// import { makeAnalyzer } from './analyzer'
// import { makeGenerator } from './generator'
var state = "\n@import { Modal } from 'some-file'\n\n@machine App\n  dismiss -> Done!\n\n  Yellow\n    hi -> Blue\n    <- go\n  Green\n    @use Modal\n  Done!\n";
var tokenizer = tokenizer_1.makeTokenizer();
var tokens = tokenizer.tokenize(state);
console.dir({ tokens: tokens }, { depth: 30 });
var parser = parser_1.makeParser();
var ast = parser.parse(tokens);
console.dir({ ast: ast }, { depth: 30 });
// const analyzer = makeAnalyzer()
// analyzer.analyze(ast, { fileName: 'file.states' }).then(newAst => {
//   const generator = makeGenerator()
//   console.log(generator.generate(newAst, 'xstate-machine-esm'))
// })
//# sourceMappingURL=tokenize.test.js.map