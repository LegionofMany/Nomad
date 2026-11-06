const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Allow importing TS/JS from the workspace root (e.g., ../../src/...)
config.watchFolders = [workspaceRoot];

// Prefer the app's node_modules; fall back to workspace node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Prevent Metro from crawling up and picking up unexpected dependency copies.
config.resolver.disableHierarchicalLookup = true;

// On Android/iOS, Node-only hashing helpers are replaced by small @noble/hashes shims.
// (Hermes has no Node `stream` module.) Web keeps its default behaviour.
const nativeShims = {
  'create-hash': path.resolve(projectRoot, 'shims/create-hash.js'),
  'create-hmac': path.resolve(projectRoot, 'shims/create-hmac.js'),
  buffer: path.resolve(projectRoot, 'node_modules/buffer/index.js'),
};
const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== 'web' && Object.prototype.hasOwnProperty.call(nativeShims, moduleName)) {
    return { type: 'sourceFile', filePath: nativeShims[moduleName] };
  }
  return (defaultResolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
