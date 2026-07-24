// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix: lucide-react-native (dan beberapa paket ESM lain) belum sepenuhnya
// kompatibel dengan resolusi "exports" field Metro di Expo SDK 52.
// Ini bikin Metro gagal resolve file .mjs individual icon-nya.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;