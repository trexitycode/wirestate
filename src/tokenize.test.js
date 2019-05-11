import { makeTokenizer } from './tokenizer'
import { makeParser } from './parser'
// import { makeAnalyzer } from './analyzer'
// import { makeGenerator } from './generator'

const state = `
@import { Modal } from 'some-file'

@machine App
  dismiss -> Done!

  Yellow
    hi -> Blue
    <- go
  Green
    @use Modal
  Done!
`

const tokenizer = makeTokenizer()
const tokens = tokenizer.tokenize(state)

console.dir({ tokens }, { depth: 30 })

const parser = makeParser()
const ast = parser.parse(tokens)

console.dir({ ast }, { depth: 30 })

// const analyzer = makeAnalyzer()
// analyzer.analyze(ast, { fileName: 'file.states' }).then(newAst => {
//   const generator = makeGenerator()
//   console.log(generator.generate(newAst, 'xstate-machine-esm'))
// })
