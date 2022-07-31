/**
 * @module Persistence using Deta Drive
 * @copyright 2021 commenthol <commenthol@gmail.com>
 * @copyright 2022 lmangani <lorenzo.mangani@gmail.com>
 * @license MIT
 */

const { Commands } = require('./Commands.js')
const { RequestParser, createArrayResp } = require('./Protocol.js')
const { logger } = require('./log.js')

const { Deta } = require('deta');
const deta = Deta(process.env.DETA_TOKEN||undefined);

/** @typedef {import('./Cache.js').Cache} Cache */

/**
 * @type {{
 *   error: (...args: any[]) => void,
 *   warn: (...args: any[]) => void,
 *   info: (...args: any[]) => void,
 *   debug: (...args: any[]) => void
 * }}
 */
let log

/**
 * Noop drain for import of keys from file
 * @private
 */
class DrainNoop {
  write () {}
}

/**
 * implements a append only filestore (AOF)
 */
class Persistence {
  /**
   * @param {{ filename: string|undefined, cache: Cache }} param0
   */
  constructor ({ filename, cache }) {
    log = logger('persistance')
    this._filename = filename
    this._cache = cache
    this._drive = null
    if (!this._filename) {
      this.write = () => {}
    } else {
      this._drive = deta.Drive(process.env.DETA_DRIVE || "redis");
    }
  }

  async load () {
    const filename = this._filename
    if (!filename) return
    
    const parser = new RequestParser()
    // @ts-ignore
    const commands = new Commands({ drain: new DrainNoop(), cache: this._cache })

    parser.on('request', req => {
      const [cmd, ...args] = req
      commands.handleCommand(cmd, args).catch(err => {
        log.error('%s for "%s" "%s"', err.message, cmd, args)
      })
    })

    log.info('loading file %s', filename)
    
    const data = await this._drive.get(filename);
    parser.parse(data);

    log.info('finished loading file %s', filename)
  }

  /**
   * @param {string} cmd
   * @param  {...any} args
   */
  write (cmd, ...args) {
    const str = createArrayResp([cmd, ...args])
    // @ts-ignore
    this._drive.put(this._filename, {data: str, contentType: 'application/octet-stream' });
  }
}

module.exports = {
  Persistence
}
