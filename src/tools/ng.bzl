load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
load(":ts.bzl", "ts_project")

def ng_project(name, **kwargs):
    """The rules_js ts_project() configured with the Angular ngc compiler.
    """
    ts_project(
        name = name,

        # Compiler
        tsc = "//src/tools:ngc",
        supports_workers = False,

        # Any other ts_project() or generic args
        **kwargs
    )

def ng_esbuild(name, **kwargs):
    """The rules_esbuild esbuild() configured with the Angular linker configuration
    """

    esbuild(
        name = name,
        config = "//src/tools:ngc.esbuild.js",
        **kwargs
    )
