"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
analyzer.analyze(scopeNode).then((scopeNode) => __awaiter(this, void 0, void 0, function* () {
    // console.dir({ scopeNode }, { depth: 30 })
    yield cache.set(wireStateFile, Promise.resolve(scopeNode));
    const generator = generator_1.makeGenerator();
    console.log(generator.generate(cache));
}), error => {
    console.error(error);
});
//# sourceMappingURL=tokenize.test.js.map