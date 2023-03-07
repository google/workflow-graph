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
const releaseDirectoryPath = path.join(__dirname, '/release');
const webComponentDistDirectoryPath =
    path.join(releaseDirectoryPath, '/web-component');
const bazelBinDirectoryPath = path.join(__dirname, '/dist');

/**
 * Ensures the destination /dist directory exists and Bazel output files are
 * present
 */
function ensureDirectoriesExist() {
  const bazelBinExists = fse.existsSync(bazelBinDirectoryPath);
  if (!bazelBinExists) {
    console.error(
        'ERROR: dist directory does not exist. Make sure you built the component before running this script.');
    process.exit(1);
  }

  fse.ensureDirSync(releaseDirectoryPath);
  fse.emptyDirSync(releaseDirectoryPath);
}

/** Copy bundled source code to /dist */
function copyBundleToDist() {
  const pathToJs =
      path.join(bazelBinDirectoryPath, 'registerWorkflowGraphWebComponent.js');
  const pathToStyles =
      path.join(bazelBinDirectoryPath, 'styles.css');
  fse.copySync(
      pathToJs,
      path.join(
          webComponentDistDirectoryPath,
          'registerWorkflowGraphWebComponent.js'),
      {dereference: true});
  fse.copySync(
      pathToStyles,
      path.join(
          webComponentDistDirectoryPath,
          'styles.css'),
      {dereference: true});
}

/** Copies source files to the /lib directory within /dist */
function copyCompiledLibrary() {
  const libDir = path.join(releaseDirectoryPath, 'lib');
  fse.ensureDirSync(libDir);
  const sourceFilesDir = path.join(__dirname, '/dist-types');

  fse.copySync(sourceFilesDir, libDir, {dereference: true});
}

/**
 * Create a package.json valid for release on NPM
 */
function copyConfigFilesToDist() {
  const webComponentPackageJson = fse.readJsonSync(packageJsonPath);
  fse.writeJsonSync(
      path.join(releaseDirectoryPath, 'package.json'), webComponentPackageJson);

  webComponentPackageJson.scripts['run-ngcc'] =
      webComponentPackageJson.scripts['postinstall'];
  delete webComponentPackageJson['postinstall'];

  fse.copySync(
      path.join(__dirname, '.npmignore'),
      path.join(releaseDirectoryPath, '.npmignore'));
  fse.copySync(
      path.join(__dirname, 'README.md'),
      path.join(releaseDirectoryPath, 'README.md'));
  fse.copySync(
      path.join(__dirname, 'LICENSE'),
      path.join(releaseDirectoryPath, 'LICENSE'));
}

(function main() {
  console.log('Starting release script...');

  console.log('Creating /dist directory...');
  ensureDirectoriesExist();

  console.log('Copying bundles to /dist...');
  copyBundleToDist();

  console.log('Copying compiled library to /dist...');
  copyCompiledLibrary();

  console.log(
      'Creating package.json for web-component and copying to /dist...');
  copyConfigFilesToDist();
})();