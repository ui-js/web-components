import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import { eslint } from 'rollup-plugin-eslint';
import postcss from 'rollup-plugin-postcss';

import pkg from './package.json';
import path from 'path';
import chalk from 'chalk';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { exec } = require('child_process');

process.env.BUILD = process.env.BUILD || 'development';
const PRODUCTION = process.env.BUILD === 'production';
const BUILD_ID =
  Date.now().toString(36).slice(-2) +
  Math.floor(Math.random() * 0x186a0).toString(36);
const BUILD_DIRECTORY = 'dist';

const TYPESCRIPT_OPTIONS = {
  // typescript: require('typescript'),
  clean: PRODUCTION,
  // verbosity: 3,
  include: ['*.ts+(|x)', '**/*.ts+(|x)', '*.js+(|x)', '**/*.js+(|x)'],
  tsconfigOverride: {
    compilerOptions: {
      // declaration: false,
    },
  },
};

const SDK_VERSION = pkg.version || 'v?.?.?';

const TERSER_OPTIONS = {
  compress: {
    drop_console: true,
    drop_debugger: true,
    ecma: 8, // Use "5" to support older browsers
    module: true,
    warnings: true,
    passes: 4,
    global_defs: {
      ENV: JSON.stringify(process.env.BUILD),
      SDK_VERSION: SDK_VERSION,
      BUILD_ID: JSON.stringify(BUILD_ID),
      GIT_VERSION: process.env.GIT_VERSION || '?.?.?',
      __DEV__: !PRODUCTION,
    },
  },
  output: {
    preamble: '/* ui-js web components' + SDK_VERSION + '  */',
    ascii_only: true, // Some browsers do not default to UTF-8 encoding
    // and scripts may fail to load if they contain non-ASCII characters.
  },
};

function normalizePath(id) {
  return path.relative(process.cwd(), id).split(path.sep).join('/');
}

function timestamp() {
  const now = new Date();
  return chalk.green(
    `${now.getHours()}:${('0' + now.getMinutes()).slice(-2)}:${(
      '0' + now.getSeconds()
    ).slice(-2)}`
  );
}

function isTTY() {
  return process.stdout.isTTY && typeof process.stdout.clearLine === 'function';
}

function writeTTY(s) {
  if (isTTY()) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    if (s) process.stdout.write(s);
  }
}

//
// Rollup "plugin" to display build progress and launch server
//
function buildProgress() {
  return {
    name: 'build-progress',
    transform(_code, id) {
      const file = normalizePath(id);
      if (file.includes(':')) {
        return;
      }

      if (isTTY()) {
        writeTTY(chalk.green(' ●') + '  Building ' + chalk.grey(file));
      } else {
        console.log(chalk.grey(file));
      }
    },
    buildEnd() {
      if (process.env.BUILD === 'watch' || process.env.BUILD === 'watching') {
        writeTTY(
          timestamp() +
            (process.env.BUILD === 'watching'
              ? ' Build updated'
              : ' Build done')
        );
      } else {
        writeTTY();
      }
      if (process.env.BUILD === 'watch') {
        process.env.BUILD = 'watching';
        writeTTY();
        console.log(chalk.green(' ✔') + '  Build complete ');
        console.log(' 🚀 Launching server');
        exec(
          "npx http-server . -s -c-1 --cors='*' -o /examples/menus.html",
          (error, stdout, stderr) => {
            if (error) {
              console.error(`http-server error: ${error}`);
              return;
            }
            console.log(stdout);
            console.error(stderr);
          }
        );
      }
    },
  };
}

const ROLLUP = [
  // Main module
  {
    onwarn(warning, warn) {
      // The use of #private class variables seem to trigger this warning.
      if (warning.code === 'THIS_IS_UNDEFINED') return;
      warn(warning);
    },
    input: 'src/web-components.ts',
    plugins: [
      buildProgress(),
      PRODUCTION && eslint({ exclude: ['**/*.less'] }),
      postcss({
        extract: false,
        modules: false,
        inject: false,
        extensions: ['.css', '.less'],
        plugins: [],
        minimize: PRODUCTION,
      }),
      resolve(),
      typescript(TYPESCRIPT_OPTIONS),
    ],
    output: [
      // esm file, suitable for native module
      {
        format: 'module',
        file: `${BUILD_DIRECTORY}/web-components.esm.js`,
        sourcemap: !PRODUCTION,
        exports: 'named',
        extend: true, // Add to the `ui` global rather than replace.
      },
      // UMD file, suitable for <script> and require()
      {
        format: 'umd',
        file: pkg.main, // `${BUILD_DIRECTORY}/ui.js`,
        name: 'ui',
        sourcemap: !PRODUCTION,
        exports: 'named',
        extend: true, // Add to the `ui` global rather than replace.
      },
    ],
    watch: {
      clearScreen: true,
      exclude: ['node_modules/**'],
    },
  },
];

if (PRODUCTION) {
  // Minified version
  ROLLUP.push({
    input: `${BUILD_DIRECTORY}/web-components.esm.js`,
    plugins: [buildProgress(), terser(TERSER_OPTIONS)],
    output: [
      {
        format: 'es',
        file: pkg.module,
        sourcemap: false,
      },
    ],
  });
  ROLLUP.push({
    input: `${BUILD_DIRECTORY}/web-components.js`,
    plugins: [buildProgress(), terser(TERSER_OPTIONS)],
    output: [
      {
        format: 'umd',
        file: pkg.main,
        name: 'ui',
        sourcemap: !PRODUCTION,
        exports: 'named',
        extend: true, // Add to the `ui` global rather than replace.
      },
    ],
  });
}

// Examples

// function example(name) {
//   return {
//     input: `examples/${name}.ts`,
//     plugins: [buildProgress(), resolve(), typescript(TYPESCRIPT_OPTIONS)],
//     output: [
//       {
//         format: 'es',
//         file: `build/${name}.js`,
//         sourcemap: true,
//       },
//     ],
//   };
// }

// ['app'].forEach((x) => {
//   ROLLUP.push(example(x));
// });

export default ROLLUP;
