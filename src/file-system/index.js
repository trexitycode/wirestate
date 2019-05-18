import * as FS from 'fs'
import * as Mkdirp from 'mkdirp'
import { promisify } from 'util'

const _fsStat = promisify(FS.stat)
const _mkdirp = promisify(Mkdirp)

/**
 * @param {string} fileName
 * @return {Promise<boolean>}
 */
export async function fileExists (fileName) {
  try {
    const stats = await _fsStat(fileName)
    return stats.isFile()
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

/**
 * @param {string} dirName
 * @return {Promise<void>}
 */
export function mkdirp (dirName) {
  return _mkdirp(dirName)
}
