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

/**
 * @fileoverview This file contains all the fake data json payloads for the
 * various testing scenarios
 */

import {baseColors, CustomNode, DagNode, DagNodeSkeleton, DagSkeleton, repeatedMetaNodes, SnapPoint, StateTable} from '../node_spec';

/**
 * The standard Fake Graph that can be used by `DagNode.createFromSkeleton()` to
 * generate a test DAG to be tested
 */
export const fakeGraph: DagSkeleton = {
  state: {
    'BQ': {
      displayName: 'BigQuery Fetcher',
      state: 'SKIPPED',
      description: 'ai_model_data',
      icon: {
        text: 'BQ',
        iconColors: 'inverted',
      },
    },
    'Transforms': {
      displayName: 'Dataproc Transforms',
      state: 'SUCCEEDED',
      description: '/api/fn_clean_data',
      icon: {
        text: 'HTTP',
        iconColors: 'inverted',
      },
    },
    'Email': {
      displayName: 'Email (deleted)',
      description: 'Email sent to management',
      icon: {
        name: 'web',
        iconset: 'shell',
        size: 'small',
      },
      modifiers: new Set(['deleted']),
      callout: 'deleted',
    },
    'Text': {
      description: 'PagerDuty text',
      state: 'NO_STATE_RUNTIME',
      icon: {
        name: 'topic',
        iconset: 'shell',
        size: 'small',
      },
    },
    'Text2': {
      description: 'PagerDuty text2',
      state: 'NO_STATE_RUNTIME',
      icon: {
        name: 'topic',
        iconset: 'shell',
        size: 'small',
      },
    },
    'Broadcast Table': {
      state: 'SUCCEEDED',
      description: 'Using a custom execution icon',
      subType: 'process node',
      icon: {
        name: 'performance-dashboard',
        iconset: 'shell',
        size: 'small',
      },
    },
    ...repeatedMetaNodes(['Extract Entities', 'Scan for Importance'], {
      state: 'SKIPPED',
    }),
    'Send via APIs': {
      state: 'PENDING',
      artifactRefs: [
        {id: 'Text Logs', path: ['sub2']},
        {id: 'Execution Logs', path: ['sub2']},
      ],
      callout: {
        text: 'This is a simple callout that goes on for way to long',
        bg: '#1a73e8',
        color: 'white',
      },
    },
    'Big Query table': {state: 'CANCELLED'},
    'AutoML Tables': {state: 'FAILED'},
    'Output to BigQuery': {state: 'RUNNING'},
    'CreateFinal': {
      conditionalQuery: '1 == 1',
      artifactRefs: [
        {id: 'BigTable', path: ['sub1']},
        {id: 'BigTable', path: ['sub1', 'subn1']},
      ],
    },
    'CustomNode1': {
      templateRef: 'outlineBasic',
      width: 480,
      height: 150,
      includeInStepCount: false,
      artifactRefs: [
        {id: 'BigTable', path: ['sub1']},
      ],
    },

    // Artifacts
    'TransformedTable': {
      state: 'NO_STATE_RUNTIME',
    },
    'BigTable': {
      state: 'NO_STATE_RUNTIME',
      displayName: 'Big Table Artifact',
      icon: {
        name: 'artifact-model',
        iconset: 'cloud_ai',
        size: 'large',
      },
    },
    'BigQueryTable': {
      state: 'NO_STATE_RUNTIME',
      icon: {
        name: 'artifact-datasets',
        iconset: 'cloud_ai',
        size: 'large',
        color: '#af5cf7'
      },
    },
    'Entities': {
      state: 'NO_STATE_RUNTIME',
      description: 'People: 512, Places: 82, Indexes: 4012',
      icon: {
        text: 'ENT',
        iconColors: 'inverted',
        color: '#52cee6',
      }
    },

    // Groups
    'TensorFlow Training': {
      state: 'TIMEOUT',
      description: 'Defaulted to iteration-2',
      hasControlNode: true,
      treatAsLoop: true,
      selectedLoopId: 'it-2',
      icon: {
        name: 'group-iterative',
        iconset: 'cloud_ai',
        size: 'medium',
      },
      groupMeta: {
        ...repeatedMetaNodes(
            ['it-1', 'it-2', 'it-4'],
            i => ({
              state: 'SUCCEEDED',
              displayName: `Iteration ${i.slice(3)}`,
              groupMeta: {
                'Trainer': {
                  state: 'SUCCEEDED',
                  description: 'gcr.io/python-images/train-cvvv-v1.1',
                  artifactRefs: [
                    {id: 'BigTable', path: []},
                  ],
                },
                'Intermediate-Model': {
                  state: 'NO_STATE_RUNTIME',
                  subType: 'model',
                  icon: {
                    name: 'artifact-model',
                    iconset: 'cloud_ai',
                    size: 'large',
                  },
                },
                'Test for accuracy': {
                  state: 'SUCCEEDED',
                  description: 'Validates that accuracy is above 85%',
                  conditionalQuery:
                      'getModel("Intermediate-Model").accuracy > .85'
                },
              },
            })),
        'it-3': {
          displayName: 'Iteration 3',
          state: 'SKIPPED',
          groupMeta: {
            'Trainer': {
              state: 'SKIPPED',
              description: 'gcr.io/python-images/train-cvvv-v1.1',
              artifactRefs: [
                {id: 'BigTable', path: []},
              ],
            },
            'Intermediate-Model': {
              state: 'NO_STATE_RUNTIME',
              subType: 'model',
              icon: {
                name: 'artifact-model',
                iconset: 'cloud_ai',
                size: 'large',
              },
            },
            'Test for accuracy': {
              state: 'NOT_TRIGGERED',
              description: 'Validates that accuracy is above 85%',
              conditionalQuery: 'getModel("Intermediate-Model").accuracy > .85'
            },
          },
        },
        'it-5': {
          displayName: 'Iteration 5',
          state: 'TIMEOUT',
          groupMeta: {
            'Trainer': {
              state: 'TIMEOUT',
              description: 'gcr.io/python-images/train-cvvv-v1.1',
              artifactRefs: [
                {id: 'BigTable', path: []},
              ],
            },
            'Intermediate-Model': {
              state: 'NO_STATE_RUNTIME',
              subType: 'model',
              icon: {
                name: 'artifact-model',
                iconset: 'cloud_ai',
                size: 'large',
              },
            },
            'Test for accuracy': {
              state: 'PENDING',
              description: 'Validates that accuracy is above 85%',
              conditionalQuery: 'getModel("Intermediate-Model").accuracy > .85'
            },
          },
        },
      },
    },
    'sub1': {
      state: 'CANCELLED',
      hasControlNode: false,
      displayName: 'Subdag (sub1)',
      groupMeta: {
        'Fake Exec 1': {
          state: 'SUCCEEDED',
          conditionalQuery: 'len(groupParam) == 1',
        },
        'BigTable': {
          displayName: 'Sub BigTable',
          state: 'NO_STATE_RUNTIME',
          icon: {
            name: 'artifact-datasets',
            iconset: 'cloud_ai',
            size: 'large',
            color: '#af5cf7'
          }
        },
        'AutoML Tables': {
          state: 'NOT_TRIGGERED',
          conditionalQuery: 'len(groupParam) > 2 && thisIsNotTest(ctx)',
        },
        'Output to BigQuery': {state: 'CANCELLING'},
        'sub1': {
          state: 'NOT_TRIGGERED',
          hasControlNode: true,
          conditionalQuery: 'isTaskDone("outputToBigQuery")',
          displayName: 'Nested Subdag (sub1)',
          artifactRefs: [
            {id: 'TransformedTable', path: []},
          ],
          groupMeta: {
            'Fake Exec 1': {
              artifactRefs: [
                {id: 'TransformedTable', path: []},
              ],
            },
            'BigTable': {
              displayName: 'Sub x2 BigTable',
              icon: {
                name: 'artifact-datasets',
                iconset: 'cloud_ai',
                size: 'large',
                color: '#af5cf7'
              }
            },
          },
        },
        'CustomNode2': {
          templateRef: 'embedYt',
          width: 280,
          height: 37,
          includeInStepCount: false,
        },
      },
    },
    'sub2': {
      state: 'RUNNING',
      hasControlNode: true,
      displayName: 'Log Ingestion (sub2)',
      description: 'A simple subdag that shows edge-snapping logic above it',
      groupMeta: {
        ...repeatedMetaNodes(['Text Logs', 'Execution Logs'], {
          state: 'NO_STATE_RUNTIME',
          icon: {
            name: 'logs',
            iconset: 'shell',
            size: 'small',
          }
        }),
        'Scan Texts': {
          state: 'SUCCEEDED',
          artifactRefs: [
            {id: 'Text', path: []},
            {id: 'Text2', path: []},
          ],
        },
        'Label Execution Logs': {
          state: 'RUNNING',
          artifactRefs: [
            {id: 'Text', path: []},
            {id: 'Entities', path: []},
          ],
        },
      },
    },
  } as StateTable,
  skeleton: [{
    id: 'BQ',
    type: 'execution',
    next: [{
      id: 'Transforms',
      type: 'execution',
      next: [{
        id: 'TransformedTable',
        type: 'artifact',
        next: [
          {
            id: 'Big Query table',
            type: 'execution',
            next: [{
              id: 'BigTable',
              type: 'artifact',
              next: [
                {
                  edgeLabel: 'storage (red-edge)',
                  edgeOpts: {
                    toMarkerStyle: 'arrow',
                    color: baseColors['red'],
                    weight: 3,
                  },
                  id: 'AutoML Tables',
                  type: 'execution',
                  next: [{
                    edgeOpts: {
                      color: baseColors['red'],
                      toMarkerStyle: 'arrow',
                    },
                    id: 'Output to BigQuery',
                    type: 'execution',
                    next: [{
                      edgeOpts: {
                        toMarkerStyle: 'arrow',
                      },
                      id: 'BigQueryTable',
                      type: 'artifact',
                      next: [{
                        edgeOpts: {
                          toMarkerStyle: 'arrow',
                        },
                        id: 'CreateFinal',
                        type: 'execution'
                      }]
                    }],
                  }]
                },
                {
                  edgeLabel: 'input-data',
                  id: 'TensorFlow Training',
                  type: 'group',
                  definition: Array.from(
                      {length: 5},
                      (e, i) => ({
                        id: `it-${i + 1}`,
                        type: 'group',
                        definition: [
                          {
                            id: 'Trainer',
                            type: 'execution',
                            next: [
                              {
                                id: 'Intermediate-Model',
                                type: 'artifact',
                                next: [
                                  {id: 'Test for accuracy', type: 'execution'},
                                ]
                              },
                            ]
                          },
                        ]
                      })),
                  next: [
                    {id: 'Output to BigQuery', type: 'execution'},
                    {
                      edgeLabel: 'SUB-DAG 1',
                      id: 'sub1',
                      type: 'group',
                      definition: [
                        {id: 'Output to BigQuery', type: 'execution'},
                        {
                          id: 'Fake Exec 1',
                          type: 'execution',
                          next: [{
                            id: 'BigTable',
                            type: 'artifact',
                            next: [
                              {
                                edgeLabel: 'storage',
                                id: 'AutoML Tables',
                                type: 'execution'
                              },
                              {
                                edgeLabel: 'SUB-DAG Nested 1',
                                id: 'subn1',
                                type: 'group',
                                definition: [
                                  {id: 'Output to BigQuery', type: 'execution'},
                                  {
                                    id: 'Fake Exec 1',
                                    type: 'execution',
                                    next: [{
                                      edgeOpts: {
                                        weight: 10,
                                      },
                                      id: 'BigTable',
                                      type: 'artifact',
                                      next: [{
                                        edgeLabel: 'storage',
                                        id: 'AutoML Tables',
                                        type: 'execution'
                                      }],
                                    }]
                                  },
                                ],
                                next: [{
                                  edgeLabel: 'custom-video',
                                  id: 'CustomNode2',
                                  type: 'artifact'
                                }],
                              }
                            ],
                          }]
                        },
                      ],
                      next: [
                        {id: 'CreateFinal', type: 'execution'},
                        {id: 'CustomNode1', type: 'execution'},
                      ],
                    },
                  ]
                },
              ]
            }]
          },
          {edgeOpts: {toMarkerStyle: 'arrow'}, id: 'sub1', type: 'group'},
          {
            id: 'Broadcast Table',
            type: 'execution',
            next: [
              {
                id: 'Email',
                type: 'artifact',
                next: [
                  {id: 'Send via APIs', type: 'execution'},
                ]
              },
              {
                id: 'Text2',
                type: 'artifact',
                next: [{edgeLabel: 'obtuse-edge', id: 'sub2', type: 'group'}]
              },
              {
                id: 'Text',
                type: 'artifact',
                next: [
                  {
                    edgeLabel: 'SUB-DAG 2',
                    id: 'sub2',
                    type: 'group',
                    definition: [
                      {
                        id: 'Scan Texts',
                        type: 'execution',
                        next: [
                          {id: 'Text Logs', type: 'artifact'},
                        ]
                      },
                      {
                        id: 'Label Execution Logs',
                        type: 'execution',
                        next: [
                          {id: 'Execution Logs', type: 'artifact'},
                        ]
                      },
                    ],
                    next: [{id: 'Send via APIs', type: 'execution'}],
                  },
                ]
              },
              {
                id: 'Extract Entities',
                type: 'execution',
                next: [
                  {
                    id: 'Scan for Importance',
                    type: 'execution',
                    next: [{id: 'sub2', type: 'group'}],
                  },
                  {
                    id: 'Entities',
                    type: 'artifact',
                    next: [{id: 'sub2', type: 'group'}]
                  },
                ]
              },
            ]
          },
        ]
      }]
    }]
  } as DagNodeSkeleton],
};

/** Helper function to create a DAG skeleton with custom group control nodes */
export function createDagSkeletonWithCustomGroups(expanded: boolean):
    DagSkeleton {
  return {
    skeleton: [{
      id: 'client',
      type: 'execution',
      next: [
        {
          id: 'customGroup',
          type: 'group',
          definition: [
            {
              id: 'node1',
              type: 'execution',
              next: [
                {
                  id: 'node2',
                  type: 'execution',
                },
              ],
            },
          ],
          next: [
            {
              id: 'backend',
              type: 'execution',
            },
          ],
        },
      ],
    } as DagNodeSkeleton],
    state: {
      'client': {
        state: 'NO_STATE_RUNTIME',
      },
      'backend': {
        state: 'NO_STATE_RUNTIME',
      },
      'customGroupControlNode': {
        templateRef: 'outlineBasic',
        width: 300,
        height: 150,
        includeInStepCount: false,
      },
      'customGroup': {
        state: 'NO_STATE_RUNTIME',
        displayName: 'Custom group node',
        groupLabel: 'Label for custom group',
        hasControlNode: true,
        hideControlNodeOnExpand: true,
        expanded,
        customControlNode: new CustomNode(
            new DagNode(
                'customGroupControlNode', 'execution', 'NO_STATE_STATIC', {
                  displayName: 'Custom group control node',
                }),
            'outlineBasic',
            400,
            73,
            ),
        groupMeta: {},
      },
    } as StateTable,
  };
}

export function createDagSkeletonWithGroups(treatAsLoop: boolean): DagSkeleton {
  return {
    state: {
      'fakeGroup': {
        state: 'TIMEOUT',
        description: 'Defaulted to iteration-2',
        hasControlNode: true,
        treatAsLoop,
        selectedLoopId: 'fakeNode1',
        groupLabel: 'Fake Group',
        icon: {
          name: 'group-iterative',
          iconset: 'cloud_ai',
          size: 'medium',
        },
        groupMeta: {
          'fakeNode1': {
            state: 'SUCCEEDED',
            displayName: 'Fake Node 1',
          },
          'fakeNode2': {
            state: 'SUCCEEDED',
            displayName: 'Fake Node 2',
          },
        },
      },
    } as StateTable,
    skeleton: [
      {
        id: 'fakeGroup',
        type: 'group',
        definition: [
          {
            id: 'fakeNode1',
            type: 'execution',
          },
          {
            id: 'fakeNode2',
            type: 'artifact',
          },
        ],
      },
    ] as DagNodeSkeleton[],
  };
}

export const fakeGraphWithEdgeOffsets: DagSkeleton = {
  skeleton: [
    {
      id: 'node1',
      type: 'execution',
      next: [
        {
          id: 'node2',
          type: 'execution',
          edgeOpts: {
            startSnapPoint: {
              horizontalOffset: 5,
              verticalOffset: 15,
              horizontalPercent: 0.4,
              verticalPercent: 0.6,
            },
            endSnapPoint: {
              horizontalPercent: 0.5,
              verticalPercent: 0.5,
            },
          },
        },
      ],
    },
    {
      id: 'node2',
      type: 'execution',
      next: [
        {
          id: 'node3',
          type: 'execution',
          edgeOpts: {
            startSnapPoint: {
              horizontalOffset: 15,
              verticalOffset: -5,
            },
            endSnapPoint: {
              horizontalOffset: 30,
              verticalPercent: 0.2,
            },
          },
        },
        {
          id: 'node4',
          type: 'execution',
          edgeOpts: {
            startSnapPoint: {},
            endSnapPoint: {
              horizontalAnchor: -0.1,
              verticalAnchor: -0.1,
            },
          },
        },
      ],
    },
    {
      id: 'node3',
      type: 'execution',
    },
    {
      id: 'node4',
      type: 'execution',
    },
  ] as DagNodeSkeleton[],
};

export const fakeGraphWithColoredLabels: DagSkeleton = {
  skeleton: [
    {
      id: 'node1',
      type: 'execution',
      next: [
        {
          id: 'node2',
          type: 'execution',
          edgeOpts: {
            label: 'label1',
            labelColor: 'red',
          },
        },
      ],
    },
    {
      id: 'node2',
      type: 'execution',
      next: [
        {
          id: 'node3',
          type: 'execution',
          edgeOpts: {
            label: 'label2',
            labelColor: '#00ffcc',
          },
        },
        {
          id: 'node4',
          type: 'execution',
          edgeOpts: {
            label: 'label3',
          },
        },
      ],
    },
    {
      id: 'node3',
      type: 'execution',
    },
    {
      id: 'node4',
      type: 'execution',
    },
  ] as DagNodeSkeleton[],
};