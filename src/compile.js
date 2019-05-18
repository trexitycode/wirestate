import * as Path from 'path'
import { makeAnalyzer, requireWireStateFile } from './analyzer'
import { makeGenerator } from './generator'
import { Cache } from './cache'

export const compile = async (fileName, { srcDir = '', cacheDir = '.wirestate', generatorName = 'json' } = {}) => {
  const cache = new Cache({ srcDir, cacheDir })
  let wireStateFile = Path.relative(Path.resolve(srcDir), Path.resolve(fileName))

  // Ensure the file we're compiling has an extension,
  // by default it's the .wirestate extension
  wireStateFile = Path.extname(wireStateFile)
    ? wireStateFile
    : `${wireStateFile}.wirestate`

  const cacheHit = await cache.has(wireStateFile)
  let scopeNode = null

  if (cacheHit) {
    scopeNode = await cache.get(wireStateFile)
  } else {
    scopeNode = await requireWireStateFile(wireStateFile, { cache, srcDir })
  }

  const analyzer = makeAnalyzer({ cache, srcDir })

  await analyzer.analyze(scopeNode)
  const generator = makeGenerator()
  return generator.generate(cache, { generatorName })
}
