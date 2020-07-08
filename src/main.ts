import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as os from 'os'
import * as fs from 'fs'
import * as stream from 'stream'
import * as crypto from 'crypto'
import * as util from 'util'
import execa from 'execa'

const getNodeVersion = async (): Promise<string> => {
  const {stdout} = await execa.command('node --version')
  return stdout
}

const yarnCacheDir = async (): Promise<string> => {
  const {stdout} = await execa.command('yarn cache dir')
  return stdout
}

const hashFile = async (file: string): Promise<string> => {
  const hash = crypto.createHash('sha256')
  const pipeline = util.promisify(stream.pipeline)
  await pipeline(fs.createReadStream(file), hash)
  return hash.digest('hex')
}

async function run(): Promise<void> {
  try {
    const cacheKeyPrefix = core.getInput('cacheKeyPrefix', {required: true})
    const baseKey = [
      os.platform,
      'node',
      await getNodeVersion(),
      process.env.NODE_ENV,
      cacheKeyPrefix
    ].join('-')
    const key = `${baseKey}-${await hashFile('yarn.lock')}`
    const restoreKeys = [baseKey]

    const paths = [await yarnCacheDir(), 'node_modules']

    const cacheKey = await cache.restoreCache(paths, key, restoreKeys)
    const cacheHit = !!cacheKey
    core.setOutput('cache-hit', cacheHit.toString())

    if (cacheKey) {
      core.debug(`cache hit: ${cacheKey}`)
      return
    }

    const installCommand = core.getInput('installCommand', {
      required: true
    })
    await execa.command(installCommand)

    // Error handling from https://github.com/actions/cache/blob/master/src/save.ts
    core.info('Saving cache')
    try {
      await cache.saveCache(paths, key)
    } catch (error) {
      if (error.name === cache.ValidationError.name) {
        throw error
      } else if (error.name === cache.ReserveCacheError.name) {
        core.info(error.message)
      } else {
        core.info(`[warning]${error.message}`)
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
