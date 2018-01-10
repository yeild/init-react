const Metalsmith = require('metalsmith')
const path = require('path')
const async = require('async')
const chalk = require('chalk')
const Handlebars = require('handlebars')
const compile = require('handlebars').compile
const ask = require('./ask')
const getOptions = require('./options')

// register handlebars helper
Handlebars.registerHelper('if_eq', function (a, b, opts) {
  return a === b
    ? opts.fn(this)
    : opts.inverse(this)
})

Handlebars.registerHelper('unless_eq', function (a, b, opts) {
  return a === b
    ? opts.inverse(this)
    : opts.fn(this)
})
/**
 *
 * @param source
 * @param destination
 * @param projectName
 */
module.exports = function generate(source, destination, projectName) {
  const metalsmith = Metalsmith(path.join(source, 'template'))
  const options = getOptions(projectName, source)

  const metadata = Object.assign(metalsmith.metadata(), {
    destDirName: projectName,
    inPlace: destination === process.cwd(),
    noEscape: true
  })
  metalsmith.use(askQuestions(options.prompts))
  .use(filterFiles(options.filters))
  .use(renderTemplateFiles)
  

  metalsmith.clean(false)
  .source('.')
  .destination(destination)
  .build((err) => {
    if (err) {
      throw err
    } else {
      console.log(chalk.green('Generated "%s" successfully.'), projectName)
      if (typeof options.complete === 'function') {
        options.complete(metadata)
      }
    }
  })
}
function askQuestions (prompts) {
  return (files, metalsmith, done) => {
    ask(prompts, metalsmith.metadata(), done)
  }
}

function filterFiles (filters) {
  return (files, metalsmith, done) => {
    if (!filters) {
      return done()
    }
    let metadata = metalsmith.metadata()
    Object.keys(filters).forEach(function (filter) {
      Object.keys(files).forEach((function (file) {
        if (file === filter && !metadata[filters[filter]]) {
          delete files[file]
        }
      }))
    })
    done()
  }
}

function renderTemplateFiles(files, metalsmith, done) {
  const keys = Object.keys(files)
  const metadata = metalsmith.metadata()
  async.each(keys, (filename, next) => {
    const str = files[filename].contents.toString()
    if (!/{{([^{}]+)}}/g.test(str)) {
      return next()
    }
    const render = compile(str, metadata)
    const result = render(metadata)
    files[filename].contents = new Buffer(result)
    next()
  }, done)
}