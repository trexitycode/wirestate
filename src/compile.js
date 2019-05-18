import * as Path from 'path'
import { makeAnalyzer, requireWireStateFile } from './analyzer'
import { makeGenerator } from './generator'
import { Cache } from './cache'

export const compile = async (fileName, { dir = '', cacheDir = '.wirestate', generatorName = 'json' } = {}) => {
  const cache = new Cache({ cacheDir })
  const wireStateFile = Path.relative(Path.resolve(dir), Path.resolve(fileName))
  const cacheHit = await cache.has(wireStateFile)
  let scopeNode = null

  if (cacheHit) {
    scopeNode = await cache.get(wireStateFile)
  } else {
    scopeNode = await requireWireStateFile(wireStateFile, { cache, dirs: [ dir ] })
  }

  const analyzer = makeAnalyzer({ cache, dirs: [ dir ] })

  await analyzer.analyze(scopeNode)
  const generator = makeGenerator()
  return generator.generate(cache, { generatorName })
}
