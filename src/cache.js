import * as Path from 'path'
import * as FS from 'fs'
import { promisify } from 'util'
import { ScopeNode } from './ast-nodes'

const fsReadFile = promisify(FS.readFile)
const fsWriteFile = promisify(FS.writeFile)
const fsUnlink = promisify(FS.unlink)
const fsStat = promisify(FS.stat)

export class Cache {
  constructor ({ cacheDir = '.wirestate' } = {}) {
    this._cacheDir = cacheDir
    /** @type {Map<string, Promise<ScopeNode>>} */
    this._table = new Map()
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
    // TODO: Create directory path
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

    await Promise.all(
      fileNames.map(fileName => {
        return this.delete(fileName)
      })
    )
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
