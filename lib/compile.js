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
const FS = require("fs");
const Path = require("path");
const util_1 = require("util");
const tokenizer_1 = require("./tokenizer");
const parser_1 = require("./parser");
const analyzer_1 = require("./analyzer");
const generator_1 = require("./generator");
const readFile = util_1.promisify(FS.readFile);
exports.compileFromSource = (src, generatorName = 'json') => __awaiter(this, void 0, void 0, function* () {
    const tokenizer = tokenizer_1.makeTokenizer();
    const tokens = tokenizer.tokenize(src);
    const parser = parser_1.makeParser();
    const ast = parser.parse(tokens);
    const analyzer = analyzer_1.makeAnalyzer();
    const newAst = yield analyzer.analyze(ast);
    const generator = generator_1.makeGenerator();
    return generator.generate(newAst, generatorName);
});
exports.compile = (fileName, generatorName = 'json') => __awaiter(this, void 0, void 0, function* () {
    const src = yield readFile(fileName, 'utf8');
    const tokenizer = tokenizer_1.makeTokenizer();
    const tokens = tokenizer.tokenize(src);
    const rootStateName = Path.basename(fileName, Path.extname(fileName));
    const parser = parser_1.makeParser();
    const ast = parser.parse(tokens, rootStateName);
    const analyzer = analyzer_1.makeAnalyzer();
    const newAst = yield analyzer.analyze(ast, { fileName });
    const generator = generator_1.makeGenerator();
    return generator.generate(newAst, generatorName);
});
//# sourceMappingURL=compile.js.map