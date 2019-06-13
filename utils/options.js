const exists = require('fs').existsSync
const getGitUser = require('./git-user')
const path = require('path')

module.exports = function options(projectName, dir) {
  const options = getMetadata(dir)
  setDefault(options, 'name', projectName)
  const author = getGitUser()
  if (author) setDefault(options, 'author', author)
  return options
}

function getMetadata(dir) {
  const metajs = path.resolve(dir, 'meta.js')
  let opts = {}
  if (exists(metajs)) {
    const metadata = require(metajs)
    if (typeof metadata !== 'object') {
      throw new Error('meta.js needs to expose an object!')
    }
    opts = metadata
  }
  return opts
}

function setDefault (opts, key, val) {
  const prompts = opts.prompts || (opts.prompts = {})
  if (!prompts[key] || typeof prompts[key] !== 'object') {
    prompts[key] = {
      'type': 'string',
      'default': val
    }
  } else {
    prompts[key]['default'] = val
  }
}
