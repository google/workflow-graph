# Workflow Graph Component (DAG)
Common component for rendering dag or tree like objects:

<p align=center><img src="https://raw.githubusercontent.com/google/workflow-graph/main/images/Axsm55JovRK.png" width="70%" ></p>


## Components
There are a few components that help with your DAG Needs

Component | Img | Description
--- | --- | ---
[Renderer](./src/app/directed_acyclic_graph.ts) | <p align=center><img src="https://github.com/google/workflow-graph/images/GGOUFUntfz9.png" width=300px></p> | The Dag Component you can use to render a Graph on page
[Toolbar](./src/app/toolbar.ts) | <p align=center><img src="https://github.com/google/workflow-graph/images/xUcvLY7Jwey.png" width=300px></p> | A toolbar that provides a `collapsability` toggle along with task status for the graph
[Scaffold](./src/app/scaffold.ts) | <p align=center><img src="https://github.com/google/workflow-graph/images/JLEFoHk8s0R.png" width=300px></p> | A parent element that can position the toolbar to be sticky above the graph while flexing within its parent to allow for CSS-less page design
[StateBadge](./src/app/node_state_badge.ts) | <p align=center><img src="https://github.com/google/workflow-graph/images/K75aYHeAaPi.png" width=300px></p> | Status icon badges for each state that an `execution` node can exist in

## Helper Classes

### [DAG Node](./src/app/node_spec.ts)

This file contains the `Node` object that's passed to the Renderer and Toolbar
components. It also allows for rapid construction of the
[`GraphSpec`](./src/app/directed_acyclic_graph_node.ts)
via static helper methods

Spec | Description
--- | ---
[DagNode](./src/app/directed_acyclic_graph_node.ts) | The Node **class** that holds all information for a single node on the graph. Superset of `DagNodeMeta`
[DagEdge](./src/app/directed_acyclic_graph_node.ts) | An edge **class** that holds `from` and `to` relationship as well as relevant edge information
[GraphSpec](./src/app/directed_acyclic_graph_node.ts) | A helper **interface** that holds `nodes`, `edges` and `nodeMap`
[DagNodeMeta](./src/app/directed_acyclic_graph_node.ts) | An **interface** that represents all meta information for a node
[DagNodeSkeleton](./src/app/directed_acyclic_graph_node.ts) | An **interface** that allows a user to write a bare-bone skeleton for a node graph / tree. This is consumed by the static [`Node.createFromSkeleton()`](./src/app/directed_acyclic_graph_node.ts) method to construct a graph.
[DagNodeLinked](./src/app/directed_acyclic_graph_node.ts) [Abandoned] | A ***`DagNode`*** implementation that has ancestry baked in within the **class** and allows child <-> parent traversal

## Development, building and re-use
### Local developer environment
This app is built with [Bazel]('https://bazel.build/'). After cloning the repo, start a local development environment by running `bazel run src:devserver` or `ng serve`. This will spin up a local `history-server` and use the Web Component version of the app, injected into a local HTML file.


### Building, bundling
To build a reusable Web Component bundle, run `bazel build src:prodapp` or `ng build`. This will create a bundle in your Bazel output directory which can be included in an HTML file to load the component.
### Use as an Angular component
Coming soon...
### NPM
Coming soon...


## Example
#### HTML Integration in an Angular app
```html
<ai-dag-scaffold>
    <ai-dag-toolbar [nodes]="graphSpec.nodes" [(expanded)]="expandedMode" />
    <ai-dag-renderer
        [nodes]="graphSpec.nodes"
        [edges]="graphSpec.edges"
        [collapsedArtifacts]="!expandedMode"
        [(selectedNode)]="selectedNode" />
</ai-dag-scaffold>
```

#### Web Component integration in any framework
This component can be built and bundled as a Web Component, which makes it reusable in a variety of stacks. A full, working example can be found [here]('./src/example/index.html').

## Next steps
- [ ] Create a release script and deploy Web Component artifacts (bundle, CSS, typings) to NPM.
- [ ] Validate usage as an Angular library, improve documentation
- [ ] Improve code structure
- [ ] Bump Angular and Angular Material versions to latest

## Disclaimer
This is not an officially supported Google product.
