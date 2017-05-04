const { existsSync, readFileSync } = require('fs');
const isPlainObject = require('is-plain-object');
const paths = require('../config/paths');

function merge(oldObj, newObj) {
  for (const key in newObj) {
    if (Array.isArray(newObj[key]) && Array.isArray(oldObj[key])) {
      oldObj[key] = oldObj[key].concat(newObj[key]);
    } else if (isPlainObject(newObj[key]) && isPlainObject(oldObj[key])) {
      oldObj[key] = Object.assign(oldObj[key], newObj[key]);
    } else {
      oldObj[key] = newObj[key];
    }
  }
}

function getConfig(configFile) {

  const jsConfig = paths.resolveApp(`${configFile}.js`);

  if (existsSync(jsConfig)) {
    return require(jsConfig);  // eslint-disable-line
  } else {
    return {};
  }
}

function replaceNpmVariables(value, pkg) {
  if (typeof value === 'string') {
    return value
      .replace('$npm_package_name', pkg.name)
      .replace('$npm_package_version', pkg.version);
  } else {
    return value;
  }
}

function realGetConfig(configFile, env, pkg = {}) {
  env = env || 'development';
  const config = getConfig(configFile, paths);
  if (config.env) {
    if (config.env[env]) merge(config, config.env[env]);
    delete config.env;
  }

  return Object.keys(config).reduce((memo, key) => {
    memo[key] = replaceNpmVariables(config[key], pkg);
    return memo;
  }, {});
}

module.exports = function() {
  const pkg = JSON.parse(readFileSync(paths.appPackageJson, 'utf-8'));
  return realGetConfig('.dopeyrc', process.env.NODE_ENV, pkg);
}

exports.realGetConfig = realGetConfig