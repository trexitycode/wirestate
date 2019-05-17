import { makeTokenizer } from './tokenizer'
import { makeParser } from './parser'
import { makeAnalyzer } from './analyzer'
// import { makeGenerator } from './generator'

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
`

const fileName = 'App.wirestate'
const tokenizer = makeTokenizer({ fileName })
const tokens = tokenizer.tokenize(state)

// console.dir({ tokens }, { depth: 30 })

const parser = makeParser({ fileName })
const scopeNode = parser.parse(tokens)

// console.dir({ scopeNode }, { depth: 30 })

const analyzer = makeAnalyzer()
analyzer.analyze(scopeNode).then(scopeNode => {
  console.dir({ scopeNode }, { depth: 30 })
  // const generator = makeGenerator()
  // console.log(generator.generate(newAst, 'xstate-machine-esm'))
}, error => {
  console.error(error)
})
