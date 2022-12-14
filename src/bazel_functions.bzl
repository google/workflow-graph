"""
Helper functions for loading Angular modules from: https://github.com/bazelbuild/rules_nodejs/tree/stable/examples/angular/tools
"""

load("@npm//@bazel/typescript:index.bzl", "ts_project")

def ts_project_a(name, tsconfig = "//src:tsconfig", **kwargs):
    ts_project(
        name = name,
        tsconfig = tsconfig,
        declaration = True,
        declaration_map = True,
        **kwargs
    )

def ng_ts_project(name, tsconfig = "//src:tsconfig", srcs = [], assets = [], **kwargs):
    ts_project_a(
        name = name,
        tsconfig = tsconfig,
        tsc = "@npm//@angular/compiler-cli/bin:ngc",
        srcs = srcs + assets,
        **kwargs
    )
