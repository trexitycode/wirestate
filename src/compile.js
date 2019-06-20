import * as Path from 'path'
import { makeTokenizer } from './tokenizer'
import { makeParser } from './parser'
import { makeAnalyzer, requireWireStateFile } from './analyzer'
import { makeGenerator } from './generator'
import { Cache } from './cache'

/**
 * @param {string} text
 * @param {string} wireStateFile
 * @param {Object} [options]
 * @param {string} [options.srcDir]
 * @param {string} [options.cacheDir]
 * @param {boolean} [options.disableActions] Flag when generating XState to disable action mapping
 * @param {string} [options.mainMachine] The ID of the machine to compile (defaults to the first machine)
 * @return {Promise<string>}
 */
export const compileFromText = async (text, wireStateFile, { srcDir = '', cacheDir = '.wirestate', disableActions = false, mainMachine = '' } = {}) => {
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

  const cache = new Cache({ srcDir, cacheDir })
  const tokenizer = makeTokenizer({ wireStateFile })
  const parser = makeParser({ wireStateFile })
  const analyzer = makeAnalyzer({ cache, srcDir })
  const generator = makeGenerator()

  const tokens = tokenizer.tokenize(text)
  let scopeNode = parser.parse(tokens)
  scopeNode = await analyzer.analyze(scopeNode)

  await cache.set(wireStateFile, Promise.resolve(scopeNode))
  let mainMachineNode = null

  if (mainMachine) {
    mainMachineNode = await cache.findMachineById(mainMachine)
    if (!mainMachineNode) {
      throw new Error(`Main machine ${mainMachine} not found`)
    }
  } else {
    const scopeNode = await cache.get(wireStateFile)
    mainMachineNode = scopeNode.machines[0]
  }

  return generator.generate(mainMachineNode, cache, { disableActions })
}

/**
 * @param {string} fileName
 * @param {Object} [options]
 * @param {string} [options.srcDir]
 * @param {string} [options.cacheDir]
 * @param {string} [options.generatorName]
 * @param {boolean} [options.disableActions] Flag when generating XState to disable action mapping
 * @param {string} [options.mainMachine] The ID of the machine to compile (defaults to the first machine)
 * @return {Promise<string>}
 */
export const compile = async (fileName, { srcDir = '', cacheDir = '.wirestate', generatorName = 'xstate', disableActions = false, mainMachine = '' } = {}) => {
  const cache = new Cache({ srcDir, cacheDir })
  let wireStateFile = Path.relative(Path.resolve(srcDir), Path.resolve(fileName))

  if (wireStateFile.startsWith('.')) {
    throw new Error('File must be located in the srcDir')
  }

  // Ensure the file we're compiling has an extension,
  // by default it's the .wirestate extension
  wireStateFile = Path.extname(wireStateFile)
    ? wireStateFile
    : `${wireStateFile}.wirestate`

  await requireWireStateFile(wireStateFile, { cache, srcDir })
  let mainMachineNode = null

  if (mainMachine) {
    const mainMachineNode = await cache.findMachineById(mainMachine)
    if (!mainMachineNode) {
      throw new Error(`Main machine ${mainMachine} not found`)
    }
  } else {
    const scopeNode = await cache.get(wireStateFile)
    mainMachineNode = scopeNode.machines[0]
  }

  const generator = makeGenerator()
  return generator.generate(mainMachineNode, cache, { generatorName, disableActions })
}
