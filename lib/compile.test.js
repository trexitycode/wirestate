"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compile_1 = require("./compile");
const text = `
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
compile_1.compileFromText(text, wireStateFile).then(async (jsonString) => {
    console.log(jsonString);
}, error => {
    console.error(error);
});
//# sourceMappingURL=compile.test.js.map