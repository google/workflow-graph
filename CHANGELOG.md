# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2024-01-11
Fixes lots of accessibility issues, improves rendering performance and updates to Angular 17.

## [0.1.0] - 2023-04-06
Updates the library to Angular v15 and Material MDC components. Material CSS is now bundled together with the component, so the separate styles.css file is no longer distributed.

## [0.0.8] - 2023-03-07
Fixes type imports in the distributed web-component library. Only a subset of the library is now distributed, so types can safely be imported.

## [0.0.7] - 2023-03-06
Removes dependency on deprecated Bazel stack and updates it to a simpler setup with [Aspect Angular rules](https://github.com/aspect-build/bazel-examples/tree/main/angular).
Fixes template typings since strict_templates have been enabled.

## [0.0.6] - 2022-12-28
Removes/renames the postinstall script as it's not required when distributed as a web-component.

### Major changes
N/A

### Changed features
N/A

## [0.0.5] - 2022-12-28
Fixes missing dependency issue when importing the graph component in React.

### Major changes
N/A

### Changed features
N/A

## [0.0.4] - 2022-12-28
Removes the need to include a .css file for the graph, as all styles will now be inlined.

### Major changes
- CSS files are no longer generated
- The location of the web-component bundle has been updated

### Changed features
N/A