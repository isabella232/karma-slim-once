var execSync = require('sync-exec');
var fs = require('fs');
var path = require('path');
var sleep = require('sleep').sleep;

var slimOnce = function(logger, config) {
  config = typeof config === 'object' ? config : {};
  var log = logger.create('preprocessor.slimonce');
  var templateJSONPath = path.resolve(config.templateJSONPath);
  var compileNgTemplatePath = path.resolve(config.compileNgTemplatePath);
  var externalCompiler = !!config.externalCompiler;

  log.debug('Slim template json path is:', templateJSONPath);
  log.debug('Slim compilation script path is:', compileNgTemplatePath);

  // Generate the templates if they don't exist
  if (!fs.existsSync(templateJSONPath)) {
    log.debug('Compiling all the slim templates at once...');
    execSync(compileNgTemplatePath);
  }
  var hasRun = {};

  return function(content, file, done) {
    var keyName = config.keyName ? config.keyName(file.originalPath) : file.originalPath;
    if (hasRun[keyName]) {
      if (externalCompiler) {
        log.debug('Waiting 1 second for external compiler...');
        sleep(1); // Give it a second to finish compile.
      }
      if (!externalCompiler || fs.statSync(templateJSONPath).mtime < fs.statSync(file.originalPath).mtime) {
        log.debug('Compiling slim files due to a file change.');
        execSync(compileNgTemplatePath);
      }
      hasRun = {};
    }
    hasRun[keyName] = true;
    var templates = JSON.parse(fs.readFileSync(templateJSONPath));

    if (templates[keyName] === undefined) {
      log.info('Found a file with no compiled template. Recompiling.');
      execSync(compileNgTemplatePath);
      templates = JSON.parse(fs.readFileSync(templateJSONPath));
    }

    done(templates[keyName]);
  }
}

slimOnce.$inject = ['logger', 'config.slimOnce'];
module.exports = slimOnce;
