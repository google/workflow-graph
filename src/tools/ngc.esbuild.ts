/**
 * ESBuild plugin to run the angular linker via babel plugin while bundling.
 *
 * Inspired by:
 *
 *  Internal angular/dev-infra-private-builds esbuild plugin
 *  - https://github.com/angular/dev-infra-private-builds/blob/afcc2494c45a63660cb560ee96179969610435db/shared-scripts/angular-linker/esbuild-plugin.mjs
 *  Rollup
 *   - https://github.com/angular/angular/blob/14.0.5/integration/ng_elements/rollup.config.mjs
 *  Webpack
 *  - https://github.com/angular/angular-cli/blob/14.0.5/packages/angular_devkit/build_angular/src/babel/webpack-loader.ts#L97-L114
 */

import { transformFileAsync } from '@babel/core';
import {
  ConsoleLogger,
  NodeJSFileSystem,
  LogLevel,
} from '@angular/compiler-cli';
import { createEs2015LinkerPlugin } from '@angular/compiler-cli/linker/babel';

const linkerBabelPlugin = createEs2015LinkerPlugin({
  fileSystem: new NodeJSFileSystem(),
  logger: new ConsoleLogger(LogLevel.warn),
  unknownDeclarationVersionHandling: 'error',
  // Must enable JIT for unit tests
  // TODO: would be ideal to only set this for tests
  linkerJitMode: true,
  // Workaround for https://github.com/angular/angular/issues/42769 and https://github.com/angular/angular-cli/issues/22647.
  sourceMapping: false,
});

const ngLinkerPlugin = {
  name: 'ng-linker-esbuild',
  setup(build: any) {
    build.onLoad({ filter: /node_modules/ }, async (args: any) => {
      const filePath = args.path;
      const transformResult = await transformFileAsync(filePath, {
        filename: filePath,
        filenameRelative: filePath,
        plugins: [linkerBabelPlugin],
        sourceMaps: 'inline',
        compact: false,
      });

      if (!transformResult) {
        throw new Error('Babel NG Linker error');
      }

      return { contents: transformResult.code };
    });
  },
};

export default {
  // Ensure only [m]js is consumed. Any typescript should be precompiled
  // and not consumed by esbuild.
  resolveExtensions: ['.mjs', '.js'],
  plugins: [ngLinkerPlugin],
};
