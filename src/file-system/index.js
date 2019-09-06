import * as FS from 'fs'
import * as Path from 'path'
import { promisify } from 'util'

const _fsStat = promisify(FS.stat)
const _mkdir = promisify(FS.mkdir)

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
export async function mkdirp (dirName) {
  try {
    await _mkdir(dirName, { recursive: true })
  } catch (error) {
    if (error.code === 'ENOENT') {
      await mkdirp(Path.dirname(dirName))
      await _mkdir(dirName)
    } else {
      throw error
    }
  }
}
