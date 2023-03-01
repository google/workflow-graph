load("@aspect_rules_ts//ts:defs.bzl", _ts_project = "ts_project")

def ts_project(name, **kwargs):
    """ts_project() macro with default tsconfig and aligning params.
    """

    _ts_project(
        name = name,

        # Default tsconfig and aligning attributes
        tsconfig = kwargs.pop("tsconfig", "//:tsconfig"),
        declaration = kwargs.pop("declaration", True),
        declaration_map = kwargs.pop("declaration_map", True),
        source_map = kwargs.pop("source_map", True),
        **kwargs
    )
