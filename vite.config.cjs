// vite.config.js
var path = require('path')
var fs = require('fs');
var { defineConfig } = require('vite')

var version = Number(process.env.VERSION) ? Number(process.env.VERSION) : Math.floor(Math.random() * 90000) + 10000;
fs.writeFileSync(path.resolve(__dirname, 'server/version.js'), 'const version = ' + version.toString() + ';\nexport default version;');

module.exports = defineConfig({
  define: {
    BUILD_VERSION: version,
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'client/index.js'),
      name: 'index',
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {
        }
      }
    }
  }
});