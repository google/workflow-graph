/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fse = require('fs-extra');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const distDirectoryPath = path.join(__dirname, '/dist');
const webComponentDistDirectoryPath =
    path.join(distDirectoryPath, '/web-component');
const bazelBinDirectoryPath = path.join(__dirname, '/bazel-bin');

/**
 * Ensures the destination /dist directory exists and Bazel output files are
 * present
 */
function ensureDirectoriesExist() {
  const bazelBinExists = fse.existsSync(bazelBinDirectoryPath);
  if (!bazelBinExists) {
    console.error(
        'ERROR: bazel-bin directory does not exist. Make sure you built the component before running this script.');
    process.exit(1);
  }

  fse.ensureDirSync(distDirectoryPath);
  fse.emptyDirSync(distDirectoryPath);
}

/** Copy bundled source code to /dist */
function copyBundleToDist() {
  const pathToMinifiedBundles =
      path.join(bazelBinDirectoryPath, 'src', 'prodapp', 'bundle-es2015.min');
  const destinationPath = path.join(webComponentDistDirectoryPath, 'bundle');
  fse.copySync(pathToMinifiedBundles, destinationPath, {dereference: true});
}

/** Copy resource files (.css) to /dist */
function copyResourcesToDist() {
  const pathToMinifiedBundles =
      path.join(bazelBinDirectoryPath, 'src', 'prodapp', 'app');
  const destinationPath = path.join(webComponentDistDirectoryPath, 'resources');
  fse.copySync(pathToMinifiedBundles, destinationPath, {dereference: true});
}

/** Copies source files to the /lib directory within /dist */
function copyCompiledLibrary() {
  const libDir = path.join(distDirectoryPath, 'lib');
  fse.ensureDirSync(libDir);
  const sourceFilesDir = path.join(bazelBinDirectoryPath, 'src');

  fse.copySync(sourceFilesDir, libDir, {dereference: true});
}

/**
 * Create a package.json valid for release on NPM
 */
function copyConfigFilesToDist() {
  const webComponentPackageJson = fse.readJsonSync(packageJsonPath);
  fse.writeJsonSync(
      path.join(distDirectoryPath, 'package.json'), webComponentPackageJson);

  fse.copySync(
      path.join(__dirname, '.npmignore'),
      path.join(distDirectoryPath, '.npmignore'));
  fse.copySync(
      path.join(__dirname, 'README.md'),
      path.join(distDirectoryPath, 'README.md'));
  fse.copySync(
      path.join(__dirname, 'LICENSE'), path.join(distDirectoryPath, 'LICENSE'));
}

(function main() {
  console.log('Starting release script...');

  console.log('Creating /dist directory...');
  ensureDirectoriesExist();

  console.log('Copying bundles to /dist...');
  copyBundleToDist();

  console.log('Copying resources to /dist...');
  copyResourcesToDist();

  console.log('Copying compiled library to /dist...');
  copyCompiledLibrary();

  console.log(
      'Creating package.json for web-component and copying to /dist...');
  copyConfigFilesToDist();
})();