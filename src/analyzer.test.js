import * as Assert from 'assert'
import { makeTokenizer } from './tokenizer'
import { makeParser } from './parser'
import { makeAnalyzer } from './analyzer'
import { Cache } from './cache'

describe('an analyzer', function () {
  const tokenizer = makeTokenizer({ wireStateFile: 'App.wirestate' })
  const parser = makeParser({ wireStateFile: 'App.wirestate' })
  const analyzer = makeAnalyzer({ cache: new Cache() })

  it('should throw if a single transition target cannot be resolved', async function () {
    const sourceText = `
@machine App
  Home
    about -> About
`
    const tokens = tokenizer.tokenize(sourceText)
    const scopeNode = parser.parse(tokens)

    Assert.rejects(analyzer.analyze(scopeNode), /Transition Target: About/).catch(_ => {})
  })

  it('should not throw if a single transition target can be resolved', async function () {
    const sourceText = `
@machine App
  Home
    about -> About
  About
`
    const tokens = tokenizer.tokenize(sourceText)
    const scopeNode = parser.parse(tokens)

    Assert.doesNotReject(analyzer.analyze(scopeNode)).catch(_ => {})
  })

  it('should throw if a multi-target transition target cannot be resolved', async function () {
    const sourceText = `
@machine App
  Home
    about -> About, Away
  About
`
    const tokens = tokenizer.tokenize(sourceText)
    const scopeNode = parser.parse(tokens)

    Assert.rejects(analyzer.analyze(scopeNode), /Transition Target: Away/).catch(_ => {})
  })

  it('should not throw if a multi-target transition target can be resolved', async function () {
    const sourceText = `
@machine App
  Home
    about -> About, Away
  About
  Away
`
    const tokens = tokenizer.tokenize(sourceText)
    const scopeNode = parser.parse(tokens)

    Assert.doesNotReject(analyzer.analyze(scopeNode)).catch(_ => {})
  })
})
