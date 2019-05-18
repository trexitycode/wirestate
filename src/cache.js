import * as Path from 'path'
import * as FS from 'fs'
import { promisify } from 'util'
import * as Mkdirp from 'mkdirp'
import { ScopeNode } from './ast-nodes'

const fsReadFile = promisify(FS.readFile)
const fsWriteFile = promisify(FS.writeFile)
const fsUnlink = promisify(FS.unlink)
const fsStat = promisify(FS.stat)
const mkdirp = promisify(Mkdirp)

export class Cache {
  constructor ({ cacheDir = '.wirestate' } = {}) {
    this._cacheDir = cacheDir
    // Table used to prevent multiple file load calls from occuring
    // i.e. if we save a promise then the get() method returns this promise
    /** @type {Map<string, Promise<ScopeNode>>} */
    this._table = new Map()
    // Additional table used for JSON serialization
    /** @type {Map<string, ScopeNode>} */
    this._scopes = new Map()
  }

  get cacheDir () { return this._cacheDir }

  get keys () {
    return this._table.keys()
  }

  async set (fileName, promise) {
    this._table.set(fileName, promise)
    const scopeNode = await promise
    const text = JSON.stringify(scopeNode, null, 2)
    const file = Path.resolve(this.cacheDir, fileName)

    this._scopes.set(fileName, scopeNode)

    await mkdirp(Path.dirname(file))
    await fsWriteFile(file, text, 'utf8')
  }

  async has (fileName) {
    if (this._isInTable(fileName)) return true
    return this._isInCacheDir(fileName)
  }

  async get (fileName) {
    if (this._isInTable(fileName)) {
      return this._loadFromTable(fileName)
    } else {
      const isInCacheDir = await this._isInCacheDir(fileName)

      if (isInCacheDir) {
        const promise = this._loadFromCacheDir(fileName)
        this.set(fileName, promise)
        return promise
      } else {
        return null
      }
    }
  }

  async delete (fileName) {
    if (this._isInTable(fileName)) {
      this._table.delete(fileName)
      this._scopes.delete(fileName)

      const file = Path.resolve(this.cacheDir, fileName)

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

    for (let fileName of this._scopes.keys()) {
      json[fileName] = this._scopes.get(fileName)
    }

    return json
  }

  _isInTable (fileName) {
    return this._table.has(fileName)
  }

  async _isInCacheDir (fileName) {
    const file = Path.resolve(this.cacheDir, fileName)

    try {
      const stats = await fsStat(file)
      return stats.isFile()
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false
      } else {
        throw error
      }
    }
  }

  _loadFromTable (fileName) {
    return this._table.get(fileName)
  }

  async _loadFromCacheDir (fileName) {
    const file = Path.resolve(this.cacheDir, fileName)
    const text = await fsReadFile(file, 'utf8')
    const json = JSON.parse(text)
    return ScopeNode.fromJSON(json)
  }
}
