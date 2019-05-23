import * as Path from 'path'
import * as FS from 'fs'
import { promisify } from 'util'
import { ScopeNode } from './ast-nodes'
import * as FileSystem from './file-system'
import { requireWireStateFile } from './analyzer'

const fsReadFile = promisify(FS.readFile)
const fsWriteFile = promisify(FS.writeFile)
const fsUnlink = promisify(FS.unlink)
const fsStat = promisify(FS.stat)

export class Cache {
  constructor ({ srcDir = '', cacheDir = '.wirestate' } = {}) {
    this._srcDir = srcDir
    this._cacheDir = cacheDir
    // Table used to prevent multiple file load calls from occuring
    // i.e. if we save a promise then the get() method returns this promise
    /** @type {Map<string, Promise<ScopeNode>>} */
    this._table = new Map()
    // Additional table used for JSON serialization
    /** @type {Map<string, ScopeNode>} */
    this._scopes = new Map()
  }

  get srcDir () { return this._srcDir }
  get cacheDir () { return this._cacheDir }
  get keys () { return this._table.keys() }

  async set (wireStateFile, promise) {
    this._table.set(wireStateFile, promise)
    const scopeNode = await promise
    const text = JSON.stringify(scopeNode, null, 2)
    const fileName = Path.resolve(this.cacheDir, wireStateFile)

    this._scopes.set(wireStateFile, scopeNode)

    await FileSystem.mkdirp(Path.dirname(fileName))
    await fsWriteFile(fileName, text, 'utf8')
  }

  async has (wireStateFile) {
    if (this._isInTable(wireStateFile)) return true
    return this._isInCacheDir(wireStateFile)
  }

  async get (wireStateFile) {
    if (this._isInTable(wireStateFile)) {
      return this._loadFromTable(wireStateFile)
    } else {
      const isInCacheDir = await this._isInCacheDir(wireStateFile)

      if (isInCacheDir) {
        const promise = this._loadFromCacheDir(wireStateFile)
        this.set(wireStateFile, promise)
        return promise
      } else {
        return null
      }
    }
  }

  async delete (wireStateFile) {
    if (this._isInTable(wireStateFile)) {
      this._table.delete(wireStateFile)
      this._scopes.delete(wireStateFile)

      const file = Path.resolve(this.cacheDir, wireStateFile)

      try {
        await fsUnlink(file)
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error
        }
      }
    }
  }

  async clear () {
    const fileNames = [ ...this._table.keys() ]
    this._table.clear()
    this._scopes.clear()

    await Promise.all(
      fileNames.map(fileName => {
        return this.delete(fileName)
      })
    )
  }

  toJSON () {
    let json = {}

    for (let wireStateFile of this._scopes.keys()) {
      json[wireStateFile] = this._scopes.get(wireStateFile)
    }

    return json
  }

  _isInTable (wireStateFile) {
    return this._table.has(wireStateFile)
  }

  async _isInCacheDir (wireStateFile) {
    const cachedFileName = Path.resolve(this.cacheDir, wireStateFile)
    const srcFileName = Path.resolve(this.srcDir, wireStateFile)

    // Load stat for the source file and the cached file
    // If any file does not exist or is not a file then return false
    // If cached file modified time is older than source file return false
    // Otherwise return true

    try {
      const cachedStats = await fsStat(cachedFileName)
      const srcStats = await fsStat(srcFileName)

      if (cachedStats.isFile() && srcStats.isFile()) {
        return cachedStats.mtimeMs >= srcStats.mtimeMs
      } else {
        return false
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false
      } else {
        throw error
      }
    }
  }

  _loadFromTable (wireStateFile) {
    return this._table.get(wireStateFile)
  }

  async _loadFromCacheDir (wireStateFile) {
    const fileName = Path.resolve(this.cacheDir, wireStateFile)
    const text = await fsReadFile(fileName, 'utf8')
    const json = JSON.parse(text)
    const scopeNode = ScopeNode.fromJSON(json)

    await Promise.all(
      scopeNode.imports.map(async importNode => {
        const cacheHit = await this.has(importNode.wireStateFile)
        if (cacheHit) return this.get(importNode.wireStateFile)
        return requireWireStateFile(importNode.wireStateFile, { cache: this, srcDir: this.srcDir })
      })
    )

    return scopeNode
  }
}
