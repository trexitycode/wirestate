/* eslint-disable-next-line */
import { ScopeNode } from './ast-nodes'
import { CacheBase } from './cache-base'

export class MemoryCache extends CacheBase {
  constructor () {
    super()
    // Table used to prevent multiple file load calls from occuring
    // i.e. if we save a promise then the get() method returns this promise
    /** @type {Map<string, Promise<ScopeNode>>} */
    this._table = new Map()
    // Additional table used for JSON serialization
    /** @type {Map<string, ScopeNode>} */
    this._scopes = new Map()
  }

  /**
   * @inheritdoc
   */
  get keys () { return [ ...this._table.keys() ] }

  /**
   * @inheritdoc
   * @param {string} wireStateFile
   * @param {Promise<ScopeNode>} promise
   */
  async set (wireStateFile, promise) {
    this._table.set(wireStateFile, promise)
    const scopeNode = await promise
    this._scopes.set(wireStateFile, scopeNode)
  }

  /**
   * @inheritdoc
   * @param {string} wireStateFile
   */
  async has (wireStateFile) {
    return this._isInTable(wireStateFile)
  }

  /**
   * @inheritdoc
   * @param {string} wireStateFile
   */
  async get (wireStateFile) {
    if (this._isInTable(wireStateFile)) {
      return this._loadFromTable(wireStateFile)
    } else {
      return null
    }
  }

  /**
   * @inheritdoc
   * @param {string} wireStateFile
   */
  async delete (wireStateFile) {
    if (this._isInTable(wireStateFile)) {
      this._table.delete(wireStateFile)
      this._scopes.delete(wireStateFile)
    }
  }

  /**
   * @inheritdoc
   */
  async clear () {
    const fileNames = [ ...this._table.keys() ]

    await Promise.all(
      fileNames.map(fileName => {
        return this.delete(fileName)
      })
    )
  }

  /**
   * @inheritdoc
   * @param {string} machineId
   */
  async findMachineById (machineId) {
    for (let wireStateFile of this.keys) {
      const scopeNode = await this._table.get(wireStateFile)

      const machine = scopeNode.machines.find(machineNode => {
        return machineNode.id === machineId
      })

      if (machine) return machine
    }

    return null
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

  _loadFromTable (wireStateFile) {
    return this._table.get(wireStateFile)
  }
}
