"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tokenizer_1 = require("./tokenizer");
const parser_1 = require("./parser");
const analyzer_1 = require("./analyzer");
const cache_1 = require("./cache");
const generator_1 = require("./generator");
const state = `
@machine App
  dismiss -> Done!

  Yellow
    go -> Green
    @use Modal

  Green
  Done!

@machine Modal
  <- go
  Start
`;
const wireStateFile = 'App.wirestate';
const tokenizer = tokenizer_1.makeTokenizer({ wireStateFile });
const tokens = tokenizer.tokenize(state);
// console.dir({ tokens }, { depth: 30 })
const parser = parser_1.makeParser({ wireStateFile });
const scopeNode = parser.parse(tokens);
// console.dir({ scopeNode }, { depth: 30 })
const cache = new cache_1.Cache();
const analyzer = analyzer_1.makeAnalyzer({ cache });
analyzer.analyze(scopeNode).then(() => {
    // console.dir({ scopeNode }, { depth: 30 })
    const generator = generator_1.makeGenerator();
    console.log(generator.generate(cache));
}, error => {
    console.error(error);
});
//# sourceMappingURL=tokenize.test.js.map