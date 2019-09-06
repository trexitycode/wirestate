import * as Path from 'path'
import { makeTokenizer } from './tokenizer'
import { makeParser } from './parser'
import { makeAnalyzer, requireWireStateFile } from './analyzer'
import { makeGenerator } from './generator'
/* eslint-disable-next-line */
import { CacheBase } from './cache-base'
import { MemoryCache } from './memory-cache'

/**
 * @param {string} text
 * @param {string} wireStateFile
 * @param {Object} [options]
 * @param {string} [options.srcDir]
 * @param {CacheBase} [options.cache]
 * @param {string} [options.generatorName]
 * @param {boolean} [options.disableCallbacks] Flag when generating XState to disable action mapping
 * @return {Promise<string>}
 */
export const compileFromText = async (text, wireStateFile, { srcDir = '', cache = new MemoryCache(), generatorName = 'json', disableCallbacks = false } = {}) => {
  if (Path.isAbsolute(wireStateFile)) {
    throw new Error('WireStateFile must be relative')
  }

  if (wireStateFile.startsWith('.')) {
    throw new Error('WireStateFile cannot be prefixed with ./ or ../')
  }

  // Ensure the file we're compiling has an extension,
  // by default it's the .wirestate extension
  wireStateFile = Path.extname(wireStateFile)
    ? wireStateFile
    : `${wireStateFile}.wirestate`

  const tokenizer = makeTokenizer({ wireStateFile })
  const parser = makeParser({ wireStateFile })
  const analyzer = makeAnalyzer({ cache, srcDir })
  const generator = makeGenerator()

  const tokens = tokenizer.tokenize(text)
  let scopeNode = parser.parse(tokens)
  scopeNode = await analyzer.analyze(scopeNode)

  await cache.set(wireStateFile, Promise.resolve(scopeNode))

  return generator.generate(cache, { generatorName, disableCallbacks })
}

/**
 * @param {string} fileName
 * @param {Object} [options]
 * @param {string} [options.srcDir]
 * @param {CacheBase} [options.cache]
 * @param {string} [options.generatorName]
 * @param {boolean} [options.disableCallbacks] Flag when generating XState to disable callback mapping
 * @return {Promise<string>}
 */
export const compile = async (fileName, { srcDir = '', cache = new MemoryCache(), generatorName = 'json', disableCallbacks = false } = {}) => {
  let wireStateFile = Path.relative(Path.resolve(srcDir), Path.resolve(fileName))

  if (wireStateFile.startsWith('.')) {
    throw new Error('File must be located in the srcDir')
  }

  // Ensure the file we're compiling has an extension,
  // by default it's the .wirestate extension
  wireStateFile = Path.extname(wireStateFile)
    ? wireStateFile
    : `${wireStateFile}.wirestate`

  const cacheHit = await cache.has(wireStateFile)

  if (cacheHit) {
    await cache.get(wireStateFile)
  } else {
    await requireWireStateFile(wireStateFile, { cache, srcDir })
  }

  const generator = makeGenerator()
  return generator.generate(cache, { generatorName, disableCallbacks })
}
