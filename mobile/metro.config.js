// The app shares the Markdown content (../content) and the pure parsing and
// scoring code (../src/lib) with the web app, so Metro has to watch the repo root.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, '../src/lib')];

module.exports = config;
