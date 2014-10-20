var execSync = require('execSync');
var fs = require('fs');
var path = require('path');

var slimOnce = function(logger, config) {
  config = typeof config === 'object' ? config : {};
  var log = logger.create('preprocessor.slimonce');
  var templateJSONPath = path.resolve(config.templateJSONPath);
  var compileNgTemplatePath = path.resolve(config.compileNgTemplatePath);

  log.debug('Slim template json path is:', templateJSONPath);
  log.debug('Slim compilation script path is:', compileNgTemplatePath);

  // Generate the templates if they don't exist
  if (!fs.existsSync(templateJSONPath)) {
    log.debug('Compiling all the slim templates at once...')
    execSync.exec(compileNgTemplatePath)
  }

  var templates = JSON.parse(fs.readFileSync(templateJSONPath));

  return function(content, file, done) {
    var keyName = config.keyName ? config.keyName(file.originalPath) : file.originalPath;
    done(templates[keyName]);
  }
}

slimOnce.$inject = ['logger', 'config.slimOnce']
module.exports = slimOnce
