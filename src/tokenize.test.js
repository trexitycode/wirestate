import { makeTokenizer } from './tokenizer'
import { makeParser } from './parser'
import { makeAnalyzer } from './analyzer'
import { Cache } from './cache'
import { makeGenerator } from './generator'

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

const wireStateFile = 'App.wirestate'
const tokenizer = makeTokenizer({ wireStateFile })
const tokens = tokenizer.tokenize(state)

// console.dir({ tokens }, { depth: 30 })

const parser = makeParser({ wireStateFile })
const scopeNode = parser.parse(tokens)

// console.dir({ scopeNode }, { depth: 30 })

const cache = new Cache()
const analyzer = makeAnalyzer({ cache })
analyzer.analyze(scopeNode).then(() => {
  // console.dir({ scopeNode }, { depth: 30 })
  const generator = makeGenerator()
  console.log(generator.generate(cache))
}, error => {
  console.error(error)
})
