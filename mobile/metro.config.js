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

module.exports = config;
