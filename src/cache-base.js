/* eslint-disable-next-line */
import { ScopeNode, MachineNode } from './ast-nodes'

/**
 * @abstract
 */
export class CacheBase {
  /**
   * All wirestate file paths in the cache.
   *
   * @type {string[]}
   */
  get keys () { throw new Error('Unimplemented') }

  /**
   * Sets a ScopeNode and associates it to a file path.
   *
   * @param {string} wireStateFile The wirestate file basename
   * @param {Promise<ScopeNode>} promise A promise that resolves to a ScopeNode
   * @return {Promise<void>}
   */
  set (wireStateFile, promise) {
    throw new Error('Unimplemented')
  }

  /**
   * Determines if the specified wirestate file is in the cache.
   *
   * @param {string} wireStateFile The file basename of a wirestate file
   * @return {Promise<boolean>}
   */
  has (wireStateFile) {
    throw new Error('Unimplemented')
  }

  /**
   * Loads a stored wirestate file's ScopeNode. If no wirestate file was stored
   * in the cache then resolves to `null`.
   *
   * @param {string} wireStateFile The file basename of a wirestate file
   * @return {Promise<ScopeNode>}
   */
  get (wireStateFile) {
    throw new Error('Unimplemented')
  }

  /**
   * Deletes a stored wirestate file from the cache.
   *
   * @param {string} wireStateFile The file basename of a wirestate file
   * @return {Promise<void>}
   */
  delete (wireStateFile) {
    throw new Error('Unimplemented')
  }

  /**
   * Deletes all stored wirestate files from the cache.
   *
   * @return {Promise<void>}
   */
  clear () {
    throw new Error('Unimplemented')
  }

  /**
   * Attempts to locate a machine by ID within any wirestate file stored in the
   * cache. The first `MachineNode` with a matching ID will be returned.
   *
   * @param {string} machineId The machine ID to search for
   * @return {Promise<MachineNode>} Resolves to the matching `MachineNode` or `null`
   */
  findMachineById (machineId) {
    throw new Error('Unimplemented')
  }

  toJSON () {
    return {}
  }
}
