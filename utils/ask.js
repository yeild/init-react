const inquirer = require('inquirer')
const async = require('async')

module.exports = function ask(prompts, metadata, done) {
  async.eachSeries(Object.keys(prompts), (key, next) => {
    prompt(prompts[key], key, metadata, next)
  }, done)
}

function prompt(prompt, key, metadata, next) {
  if (prompt.when && !metadata[prompt.when]) {
    return next()
  }
  inquirer.prompt([{
    name: key,
    type: prompt.type,
    message: prompt.message,
    choices: prompt.choices || [],
    validate: prompt.validate || (() => true),
    default: prompt.default
  }])
  .then(answers => {
    metadata[key] = answers[key]
    next()
  }).catch(function (e) {
    throw e
  })
}
