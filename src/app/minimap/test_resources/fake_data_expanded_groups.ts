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

import {GraphSpec} from '../../node_spec';

/**
 * A Fake GraphSpec to test Minimap component. It is containing the x, y, width
 * and hight properties too, which are essential for the Minimap rendering.
 * By default these are calculated in the DagRaw component.
 */
export const graph: GraphSpec = {
  groups: [
    {
      'id': 'sub1',
      'displayName': 'Subdag (sub1)',
      'nodes': [
        {
          'id': 'Output to BigQuery',
          'displayName': '',
          'type': 'execution',
          'state': 'CANCELLING',
          'stateTooltip': '',
          'iconTooltip': '',
          'conditionalQuery': '',
          'modifiers': {},
          'callout': '',
          'options': {},
          'description': '',
          'descriptionTooltip': '',
          'artifactRefs': [],
          'x': 166,
          'y': 52,
          'width': 284,
          'height': 56,
          'cssTransform': 'translate(calc(166px - 50%), calc(52px - 50%))',
          'icon': {
            'name': 'execution',
            'iconset': 'cloud_ai',
            'iconColors': 'normal',
            'color': '#1A73E8',
            'contrastColor': 'white',
            'size': 'large'
          },
          'origIcon': {}
        },
        {
          'id': 'Fake Exec 1',
          'displayName': '',
          'type': 'execution',
          'state': 'SUCCEEDED',
          'stateTooltip': '',
          'iconTooltip': '',
          'conditionalQuery': 'len(groupParam) == 1',
          'modifiers': {},
          'callout': '',
          'options': {},
          'description': '',
          'descriptionTooltip': '',
          'artifactRefs': [],
          'x': 502,
          'y': 52,
          'width': 308,
          'height': 56,
          'cssTransform': 'translate(calc(502px - 50%), calc(52px - 50%))',
          'icon': {
            'name': 'execution',
            'iconset': 'cloud_ai',
            'iconColors': 'normal',
            'color': '#1A73E8',
            'contrastColor': 'white',
            'size': 'large'
          },
          'origIcon': {}
        },
        {
          'id': 'BigTable',
          'displayName': 'Sub BigTable',
          'type': 'artifact',
          'state': 'NO_STATE_RUNTIME',
          'stateTooltip': '',
          'iconTooltip': '',
          'conditionalQuery': '',
          'modifiers': {},
          'callout': '',
          'options': {},
          'description': '',
          'descriptionTooltip': '',
          'artifactRefs': [],
          'x': 502,
          'y': 159.2,
          'width': 38.400000000000006,
          'height': 38.400000000000006,
          'cssTransform': 'translate(calc(502px - 50%), calc(159.2px - 50%))',
          'icon': {
            'name': 'artifact-datasets',
            'iconset': 'cloud_ai',
            'iconColors': 'normal',
            'color': '#af5cf7',
            'contrastColor': 'white',
            'size': 'large'
          },
          'origIcon': {
            'name': 'artifact-datasets',
            'iconset': 'cloud_ai',
            'size': 'large',
            'color': '#af5cf7'
          }
        },
        {
          'id': 'AutoML Tables',
          'displayName': '',
          'type': 'execution',
          'state': 'NOT_TRIGGERED',
          'stateTooltip': '',
          'iconTooltip': '',
          'conditionalQuery': 'len(groupParam) > 2 && thisIsNotTest(ctx)',
          'modifiers': {},
          'callout': '',
          'options': {},
          'description': '',
          'descriptionTooltip': '',
          'artifactRefs': [],
          'x': 259.1666666666667,
          'y': 397.6,
          'width': 308,
          'height': 56,
          'cssTransform':
              'translate(calc(259.1666666666667px - 50%), calc(397.6px - 50%))',
          'icon': {
            'name': 'execution',
            'iconset': 'cloud_ai',
            'iconColors': 'normal',
            'color': '#1A73E8',
            'contrastColor': 'white',
            'size': 'large'
          },
          'origIcon': {}
        },
        {
          'id': 'CustomNode2',
          'displayName': '',
          'type': 'artifact',
          'state': 'NO_STATE_STATIC',
          'stateTooltip': '',
          'iconTooltip': '',
          'conditionalQuery': '',
          'modifiers': {},
          'callout': '',
          'options': {},
          'description': '',
          'descriptionTooltip': '',
          'artifactRefs': [],
          'x': 744.8333333333334,
          'y': 635.3,
          'width': 280,
          'height': 37,
          'cssTransform':
              'translate(calc(744.8333333333334px - 50%), calc(635.3px - 50%))',
          'icon': {
            'name': 'artifact-generic',
            'iconset': 'cloud_ai',
            'iconColors': 'normal',
            'color': '#fbbc04',
            'contrastColor': 'white',
            'size': 'large'
          },
          'includeInStepCount': false,
          'hideEdgeMarkers': false,
          'templateRef': 'embedYt',
          'origIcon': {}
        }
      ],
      'edges': [
        {
          'from': 'Fake Exec 1',
          'to': 'BigTable',
          'points':
              [{'x': 502, 'y': 80}, {'x': 502, 'y': 110}, {'x': 502, 'y': 140}]
        },
        {
          'from': 'BigTable',
          'to': 'AutoML Tables',
          'label': 'storage',
          'points': [
            {'x': 482.8, 'y': 163.0900754975978},
            {'x': 259.1666666666667, 'y': 208.4},
            {'x': 259.1666666666667, 'y': 369.6}
          ]
        },
        {
          'from': 'BigTable',
          'to': 'subn1',
          'label': 'SUB-DAG Nested 1',
          'points': [
            {'x': 521.2, 'y': 163.09007549759778},
            {'x': 744.8333333333334, 'y': 208.4},
            {'x': 744.8333333333334, 'y': 238.40000000000003}
          ]
        },
        {
          'from': 'subn1',
          'to': 'CustomNode2',
          'label': 'custom-video',
          'points': [
            {'x': 744.8333333333334, 'y': 556.8},
            {'x': 744.8333333333334, 'y': 586.8},
            {'x': 744.8333333333334, 'y': 616.8}
          ]
        }
      ],
      'groups': [{
        'id': 'subn1',
        'displayName': '',
        'nodes': [
          {
            'id': 'Output to BigQuery',
            'displayName': '',
            'type': 'execution',
            'state': 'NO_STATE_STATIC',
            'stateTooltip': '',
            'iconTooltip': '',
            'conditionalQuery': '',
            'modifiers': {},
            'callout': '',
            'options': {},
            'description': '',
            'descriptionTooltip': '',
            'artifactRefs': [],
            'x': 142,
            'y': 52,
            'width': 236,
            'height': 56,
            'cssTransform': 'translate(calc(142px - 50%), calc(52px - 50%))',
            'icon': {
              'name': 'execution',
              'iconset': 'cloud_ai',
              'iconColors': 'normal',
              'color': '#1A73E8',
              'contrastColor': 'white',
              'size': 'large'
            },
            'origIcon': {}
          },
          {
            'id': 'Fake Exec 1',
            'displayName': '',
            'type': 'execution',
            'state': 'NO_STATE_STATIC',
            'stateTooltip': '',
            'iconTooltip': '',
            'conditionalQuery': '',
            'modifiers': {},
            'callout': '',
            'options': {},
            'description': '',
            'descriptionTooltip': '',
            'artifactRefs': [],
            'x': 418,
            'y': 52,
            'width': 236,
            'height': 56,
            'cssTransform': 'translate(calc(418px - 50%), calc(52px - 50%))',
            'icon': {
              'name': 'execution',
              'iconset': 'cloud_ai',
              'iconColors': 'normal',
              'color': '#1A73E8',
              'contrastColor': 'white',
              'size': 'large'
            },
            'origIcon': {}
          },
          {
            'id': 'BigTable',
            'displayName': '',
            'type': 'artifact',
            'state': 'NO_STATE_STATIC',
            'stateTooltip': '',
            'iconTooltip': '',
            'conditionalQuery': '',
            'modifiers': {},
            'callout': '',
            'options': {},
            'description': '',
            'descriptionTooltip': '',
            'artifactRefs': [],
            'x': 418,
            'y': 159.2,
            'width': 38.400000000000006,
            'height': 38.400000000000006,
            'cssTransform': 'translate(calc(418px - 50%), calc(159.2px - 50%))',
            'icon': {
              'name': 'artifact-generic',
              'iconset': 'cloud_ai',
              'iconColors': 'normal',
              'color': '#fbbc04',
              'contrastColor': 'white',
              'size': 'large'
            },
            'origIcon': {}
          },
          {
            'id': 'AutoML Tables',
            'displayName': '',
            'type': 'execution',
            'state': 'NO_STATE_STATIC',
            'stateTooltip': '',
            'iconTooltip': '',
            'conditionalQuery': '',
            'modifiers': {},
            'callout': '',
            'options': {},
            'description': '',
            'descriptionTooltip': '',
            'artifactRefs': [],
            'x': 418,
            'y': 266.4,
            'width': 236,
            'height': 56,
            'cssTransform': 'translate(calc(418px - 50%), calc(266.4px - 50%))',
            'icon': {
              'name': 'execution',
              'iconset': 'cloud_ai',
              'iconColors': 'normal',
              'color': '#1A73E8',
              'contrastColor': 'white',
              'size': 'large'
            },
            'origIcon': {}
          }
        ],
        'edges': [
          {
            'from': 'Fake Exec 1',
            'to': 'BigTable',
            'weight': 10,
            'points': [
              {'x': 418, 'y': 80}, {'x': 418, 'y': 110}, {'x': 418, 'y': 140}
            ]
          },
          {
            'from': 'BigTable',
            'to': 'AutoML Tables',
            'label': 'storage',
            'points': [
              {'x': 418, 'y': 178.39999999999998}, {'x': 418, 'y': 208.4},
              {'x': 418, 'y': 238.4}
            ]
          }
        ],
        'groups': [],
        'state': 'NO_STATE_STATIC',
        'description': '',
        'descriptionTooltip': '',
        'hasControlNode': false,
        'treatAsLoop': false,
        'conditionalQuery': '',
        'callout': '',
        'modifiers': {},
        'stateTooltip': '',
        'iconTooltip': '',
        'options': {},
        'artifactRefs': [],
        'x': 744.8333333333334,
        'y': 397.6,
        'cssTransform':
            'translate(calc(744.8333333333334px - 50%), calc(397.6px - 50%))',
        'width': 583.3333333333334,
        'height': 318.4,
        'expanded': true,
        'padY': 0,
        'expandedDims': {'width': 583.3333333333334, 'height': 318.4}
      }],
      'state': 'CANCELLED',
      'description': '',
      'descriptionTooltip': '',
      'hasControlNode': false,
      'treatAsLoop': false,
      'conditionalQuery': '',
      'callout': '',
      'modifiers': {},
      'stateTooltip': '',
      'iconTooltip': '',
      'options': {},
      'artifactRefs': [],
      'x': 1019.9166666666665,
      'y': 1444.6333333333332,
      'cssTransform':
          'translate(calc(1019.9166666666665px - 50%), calc(1444.6333333333332px - 50%))',
      'width': 1083.8333333333333,
      'height': 705.8,
      'expanded': true,
      'padY': 0,
      'expandedDims': {'width': 1083.8333333333333, 'height': 705.8}
    },
    {
      'id': 'TensorFlow Training',
      'displayName': '',
      'nodes': [],
      'edges': [],
      'groups': [
        {
          'id': 'it-1',
          'displayName': 'Iteration 1',
          'nodes': [
            {
              'id': 'Trainer',
              'displayName': '',
              'type': 'execution',
              'state': 'SUCCEEDED',
              'stateTooltip': '',
              'iconTooltip': '',
              'conditionalQuery': '',
              'modifiers': {},
              'callout': '',
              'options': {},
              'description': 'gcr.io/python-images/train-cvvv-v1.1',
              'descriptionTooltip': '',
              'artifactRefs': [{'id': 'BigTable', 'path': []}],
              'x': -1,
              'y': -1,
              'width': 0,
              'height': 0,
              'cssTransform': ''
            },
            {
              'id': 'Intermediate-Model',
              'displayName': '',
              'type': 'artifact',
              'state': 'NO_STATE_RUNTIME',
              'stateTooltip': '',
              'iconTooltip': '',
              'conditionalQuery': '',
              'modifiers': {},
              'callout': '',
              'options': {},
              'description': '',
              'descriptionTooltip': '',
              'artifactRefs': [],
              'x': -1,
              'y': -1,
              'width': 0,
              'height': 0,
              'cssTransform': '',
              'icon': {
                'name': 'artifact-model',
                'iconset': 'cloud_ai',
                'size': 'large'
              },
              'subType': 'model'
            },
            {
              'id': 'Test for accuracy',
              'displayName': '',
              'type': 'execution',
              'state': 'SUCCEEDED',
              'stateTooltip': '',
              'iconTooltip': '',
              'conditionalQuery':
                  'getModel("Intermediate-Model").accuracy > .85',
              'modifiers': {},
              'callout': '',
              'options': {},
              'description': 'Validates that accuracy is above 85%',
              'descriptionTooltip': '',
              'artifactRefs': [],
              'x': -1,
              'y': -1,
              'width': 0,
              'height': 0,
              'cssTransform': ''
            }
          ],
          'edges': [
            {'from': 'Trainer', 'to': 'Intermediate-Model'},
            {'from': 'Intermediate-Model', 'to': 'Test for accuracy'}
          ],
          'groups': [],
          'state': 'SUCCEEDED',
          'description': '',
          'descriptionTooltip': '',
          'hasControlNode': false,
          'treatAsLoop': false,
          'conditionalQuery': '',
          'callout': '',
          'modifiers': {},
          'stateTooltip': '',
          'iconTooltip': '',
          'options': {},
          'artifactRefs': [],
          'x': -1,
          'y': -1,
          'cssTransform': '',
          'width': 0,
          'height': 0,
          'expanded': false,
          'hidden': false
        },
        {
          'id': 'it-2',
          'displayName': 'Iteration 2',
          'nodes': [
            {
              'id': 'Trainer',
              'displayName': '',
              'type': 'execution',
              'state': 'SUCCEEDED',
              'stateTooltip': '',
              'iconTooltip': '',
              'conditionalQuery': '',
              'modifiers': {},
              'callout': '',
              'options': {},
              'description': 'gcr.io/python-images/train-cvvv-v1.1',
              'descriptionTooltip': '',
              'artifactRefs': [{'id': 'BigTable', 'path': []}],
              'x': -1,
              'y': -1,
              'width': 0,
              'height': 0,
              'cssTransform': ''
            },
            {
              'id': 'Intermediate-Model',
              'displayName': '',
              'type': 'artifact',
              'state': 'NO_STATE_RUNTIME',
              'stateTooltip': '',
              'iconTooltip': '',
              'conditionalQuery': '',
              'modifiers': {},
              'callout': '',
              'options': {},
              'description': '',
              'descriptionTooltip': '',
              'artifactRefs': [],
              'x': -1,
              'y': -1,
              'width': 0,
              'height': 0,
              'cssTransform': '',
              'icon': {
                'name': 'artifact-model',
                'iconset': 'cloud_ai',
                'size': 'large'
              },
              'subType': 'model'
            },
            {
              'id': 'Test for accuracy',
              'displayName': '',
              'type': 'execution',
              'state': 'SUCCEEDED',
              'stateTooltip': '',
              'iconTooltip': '',
              'conditionalQuery':
                  'getModel("Intermediate-Model").accuracy > .85',
              'modifiers': {},
              'callout': '',
              'options': {},
              'description': 'Validates that accuracy is above 85%',
              'descriptionTooltip': '',
              'artifactRefs': [],
              'x': -1,
              'y': -1,
              'width': 0,
              'height': 0,
              'cssTransform': ''
            }
          ],
          'edges': [
            {'from': 'Trainer', 'to': 'Intermediate-Model'},
            {'from': 'Intermediate-Model', 'to': 'Test for accuracy'}
          ],
          'groups': [],
          'state': 'SUCCEEDED',
          'description': '',
          'descriptionTooltip': '',
          'hasControlNode': false,
          'treatAsLoop': false,
          'conditionalQuery': '',
          'callout': '',
          'modifiers': {},
          'stateTooltip': '',
          'iconTooltip': '',
          'options': {},
          'artifactRefs': [],
          'x': -1,
          'y': -1,
          'cssTransform': '',
          'width': 0,
          'height': 0,
          'expanded': false,
          'hidden': false
        },
        {
          'id': 'it-3',
          'displayName': 'Iteration 3',
          'nodes': [
            {
              'id': 'Trainer',
              'displayName': '',
              'type': 'execution',
              'state': 'SKIPPED',
              'stateTooltip': '',
              'iconTooltip': '',
              'conditionalQuery': '',
              'modifiers': {},
              'callout': '',
              'options': {},
              'description': 'gcr.io/python-images/train-cvvv-v1.1',
              'descriptionTooltip': '',
              'artifactRefs': [{'id': 'BigTable', 'path': []}],
              'x': -1,
              'y': -1,
              'width': 0,
              'height': 0,
              'cssTransform': ''
            },
            {
              'id': 'Intermediate-Model',
              'displayName': '',
              'type': 'artifact',
              'state': 'NO_STATE_RUNTIME',
              'stateTooltip': '',
              'iconTooltip': '',
              'conditionalQuery': '',
              'modifiers': {},
              'callout': '',
              'options': {},
              'description': '',
              'descriptionTooltip': '',
              'artifactRefs': [],
              'x': -1,
              'y': -1,
              'width': 0,
              'height': 0,
              'cssTransform': '',
              'icon': {
                'name': 'artifact-model',
                'iconset': 'cloud_ai',
                'size': 'large'
              },
              'subType': 'model'
            },
            {
              'id': 'Test for accuracy',
              'displayName': '',
              'type': 'execution',
              'state': 'NOT_TRIGGERED',
              'stateTooltip': '',
              'iconTooltip': '',
              'conditionalQuery':
                  'getModel("Intermediate-Model").accuracy > .85',
              'modifiers': {},
              'callout': '',
              'options': {},
              'description': 'Validates that accuracy is above 85%',
              'descriptionTooltip': '',
              'artifactRefs': [],
              'x': -1,
              'y': -1,
              'width': 0,
              'height': 0,
              'cssTransform': ''
            }
          ],
          'edges': [
            {'from': 'Trainer', 'to': 'Intermediate-Model'},
            {'from': 'Intermediate-Model', 'to': 'Test for accuracy'}
          ],
          'groups': [],
          'state': 'SKIPPED',
          'description': '',
          'descriptionTooltip': '',
          'hasControlNode': false,
          'treatAsLoop': false,
          'conditionalQuery': '',
          'callout': '',
          'modifiers': {},
          'stateTooltip': '',
          'iconTooltip': '',
          'options': {},
          'artifactRefs': [],
          'x': -1,
          'y': -1,
          'cssTransform': '',
          'width': 0,
          'height': 0,
          'expanded': false,
          'hidden': false
        },
        {
          'id': 'it-4',
          'displayName': 'Iteration 4',
          'nodes': [
            {
              'id': 'Trainer',
              'displayName': '',
              'type': 'execution',
              'state': 'SUCCEEDED',
              'stateTooltip': '',
              'iconTooltip': '',
              'conditionalQuery': '',
              'modifiers': {},
              'callout': '',
              'options': {},
              'description': 'gcr.io/python-images/train-cvvv-v1.1',
              'descriptionTooltip': '',
              'artifactRefs': [{'id': 'BigTable', 'path': []}],
              'x': -1,
              'y': -1,
              'width': 0,
              'height': 0,
              'cssTransform': ''
            },
            {
              'id': 'Intermediate-Model',
              'displayName': '',
              'type': 'artifact',
              'state': 'NO_STATE_RUNTIME',
              'stateTooltip': '',
              'iconTooltip': '',
              'conditionalQuery': '',
              'modifiers': {},
              'callout': '',
              'options': {},
              'description': '',
              'descriptionTooltip': '',
              'artifactRefs': [],
              'x': -1,
              'y': -1,
              'width': 0,
              'height': 0,
              'cssTransform': '',
              'icon': {
                'name': 'artifact-model',
                'iconset': 'cloud_ai',
                'size': 'large'
              },
              'subType': 'model'
            },
            {
              'id': 'Test for accuracy',
              'displayName': '',
              'type': 'execution',
              'state': 'SUCCEEDED',
              'stateTooltip': '',
              'iconTooltip': '',
              'conditionalQuery':
                  'getModel("Intermediate-Model").accuracy > .85',
              'modifiers': {},
              'callout': '',
              'options': {},
              'description': 'Validates that accuracy is above 85%',
              'descriptionTooltip': '',
              'artifactRefs': [],
              'x': -1,
              'y': -1,
              'width': 0,
              'height': 0,
              'cssTransform': ''
            }
          ],
          'edges': [
            {'from': 'Trainer', 'to': 'Intermediate-Model'},
            {'from': 'Intermediate-Model', 'to': 'Test for accuracy'}
          ],
          'groups': [],
          'state': 'SUCCEEDED',
          'description': '',
          'descriptionTooltip': '',
          'hasControlNode': false,
          'treatAsLoop': false,
          'conditionalQuery': '',
          'callout': '',
          'modifiers': {},
          'stateTooltip': '',
          'iconTooltip': '',
          'options': {},
          'artifactRefs': [],
          'x': -1,
          'y': -1,
          'cssTransform': '',
          'width': 0,
          'height': 0,
          'expanded': false,
          'hidden': false
        },
        {
          'id': 'it-5',
          'displayName': 'Iteration 5',
          'nodes': [
            {
              'id': 'Trainer',
              'displayName': '',
              'type': 'execution',
              'state': 'TIMEOUT',
              'stateTooltip': '',
              'iconTooltip': '',
              'conditionalQuery': '',
              'modifiers': {},
              'callout': '',
              'options': {},
              'description': 'gcr.io/python-images/train-cvvv-v1.1',
              'descriptionTooltip': '',
              'artifactRefs': [{'id': 'BigTable', 'path': []}],
              'x': 178,
              'y': 108.93333333333334,
              'width': 284,
              'height': 56,
              'cssTransform':
                  'translate(calc(178px - 50%), calc(108.93333333333334px - 50%))',
              'icon': {
                'name': 'execution',
                'iconset': 'cloud_ai',
                'iconColors': 'normal',
                'color': '#1A73E8',
                'contrastColor': 'white',
                'size': 'large'
              },
              'origIcon': {}
            },
            {
              'id': 'Intermediate-Model',
              'displayName': '',
              'type': 'artifact',
              'state': 'NO_STATE_RUNTIME',
              'stateTooltip': '',
              'iconTooltip': '',
              'conditionalQuery': '',
              'modifiers': {},
              'callout': '',
              'options': {},
              'description': '',
              'descriptionTooltip': '',
              'artifactRefs': [],
              'x': 178,
              'y': 216.13333333333333,
              'width': 38.400000000000006,
              'height': 38.400000000000006,
              'cssTransform':
                  'translate(calc(178px - 50%), calc(216.13333333333333px - 50%))',
              'icon': {
                'name': 'artifact-model',
                'iconset': 'cloud_ai',
                'iconColors': 'normal',
                'color': '#fbbc04',
                'contrastColor': 'white',
                'size': 'large'
              },
              'subType': 'model',
              'origIcon': {
                'name': 'artifact-model',
                'iconset': 'cloud_ai',
                'size': 'large'
              }
            },
            {
              'id': 'Test for accuracy',
              'displayName': '',
              'type': 'execution',
              'state': 'PENDING',
              'stateTooltip': '',
              'iconTooltip': '',
              'conditionalQuery':
                  'getModel("Intermediate-Model").accuracy > .85',
              'modifiers': {},
              'callout': '',
              'options': {},
              'description': 'Validates that accuracy is above 85%',
              'descriptionTooltip': '',
              'artifactRefs': [],
              'x': 178,
              'y': 323.33333333333337,
              'width': 308,
              'height': 56,
              'cssTransform':
                  'translate(calc(178px - 50%), calc(323.33333333333337px - 50%))',
              'icon': {
                'name': 'execution',
                'iconset': 'cloud_ai',
                'iconColors': 'normal',
                'color': '#1A73E8',
                'contrastColor': 'white',
                'size': 'large'
              },
              'origIcon': {}
            }
          ],
          'edges': [
            {
              'from': 'Trainer',
              'to': 'Intermediate-Model',
              'points': [
                {'x': 178, 'y': 136.93333333333334},
                {'x': 178, 'y': 166.93333333333334},
                {'x': 178, 'y': 196.93333333333334}
              ]
            },
            {
              'from': 'Intermediate-Model',
              'to': 'Test for accuracy',
              'points': [
                {'x': 178, 'y': 235.33333333333331},
                {'x': 178, 'y': 265.33333333333337},
                {'x': 178, 'y': 295.33333333333337}
              ]
            }
          ],
          'groups': [],
          'state': 'TIMEOUT',
          'description': '',
          'descriptionTooltip': '',
          'hasControlNode': false,
          'treatAsLoop': false,
          'conditionalQuery': '',
          'callout': '',
          'modifiers': {},
          'stateTooltip': '',
          'iconTooltip': '',
          'options': {},
          'artifactRefs': [],
          'x': -1,
          'y': -1,
          'cssTransform': '',
          'width': 0,
          'height': 0,
          'expanded': false,
          'hidden': false
        }
      ],
      'state': 'TIMEOUT',
      'description': 'Defaulted to iteration-2',
      'descriptionTooltip': '',
      'hasControlNode': true,
      'treatAsLoop': true,
      'conditionalQuery': '',
      'callout': '',
      'modifiers': {},
      'stateTooltip': '',
      'iconTooltip': '',
      'options': {},
      'artifactRefs': [],
      'selectedLoopId': 'it-5',
      'x': 878.8249999999998,
      'y': 830.0666666666666,
      'cssTransform':
          'translate(calc(878.8249999999998px - 50%), calc(844.0666666666666px - 50%))',
      'width': 379.3333333333333,
      'height': 403.33333333333337,
      'expanded': true,
      'icon':
          {'name': 'group-iterative', 'iconset': 'cloud_ai', 'size': 'medium'},
      'padY': 28,
      '_cachedSelection': {
        'id': 'it-5',
        'displayName': 'Iteration 5',
        'nodes': [
          {
            'id': 'Trainer',
            'displayName': '',
            'type': 'execution',
            'state': 'TIMEOUT',
            'stateTooltip': '',
            'iconTooltip': '',
            'conditionalQuery': '',
            'modifiers': {},
            'callout': '',
            'options': {},
            'description': 'gcr.io/python-images/train-cvvv-v1.1',
            'descriptionTooltip': '',
            'artifactRefs': [{'id': 'BigTable', 'path': []}],
            'x': 178,
            'y': 108.93333333333334,
            'width': 284,
            'height': 56,
            'cssTransform':
                'translate(calc(178px - 50%), calc(108.93333333333334px - 50%))',
            'icon': {
              'name': 'execution',
              'iconset': 'cloud_ai',
              'iconColors': 'normal',
              'color': '#1A73E8',
              'contrastColor': 'white',
              'size': 'large'
            },
            'origIcon': {}
          },
          {
            'id': 'Intermediate-Model',
            'displayName': '',
            'type': 'artifact',
            'state': 'NO_STATE_RUNTIME',
            'stateTooltip': '',
            'iconTooltip': '',
            'conditionalQuery': '',
            'modifiers': {},
            'callout': '',
            'options': {},
            'description': '',
            'descriptionTooltip': '',
            'artifactRefs': [],
            'x': 178,
            'y': 216.13333333333333,
            'width': 38.400000000000006,
            'height': 38.400000000000006,
            'cssTransform':
                'translate(calc(178px - 50%), calc(216.13333333333333px - 50%))',
            'icon': {
              'name': 'artifact-model',
              'iconset': 'cloud_ai',
              'iconColors': 'normal',
              'color': '#fbbc04',
              'contrastColor': 'white',
              'size': 'large'
            },
            'subType': 'model',
            'origIcon': {
              'name': 'artifact-model',
              'iconset': 'cloud_ai',
              'size': 'large'
            }
          },
          {
            'id': 'Test for accuracy',
            'displayName': '',
            'type': 'execution',
            'state': 'PENDING',
            'stateTooltip': '',
            'iconTooltip': '',
            'conditionalQuery': 'getModel("Intermediate-Model").accuracy > .85',
            'modifiers': {},
            'callout': '',
            'options': {},
            'description': 'Validates that accuracy is above 85%',
            'descriptionTooltip': '',
            'artifactRefs': [],
            'x': 178,
            'y': 323.33333333333337,
            'width': 308,
            'height': 56,
            'cssTransform':
                'translate(calc(178px - 50%), calc(323.33333333333337px - 50%))',
            'icon': {
              'name': 'execution',
              'iconset': 'cloud_ai',
              'iconColors': 'normal',
              'color': '#1A73E8',
              'contrastColor': 'white',
              'size': 'large'
            },
            'origIcon': {}
          }
        ],
        'edges': [
          {
            'from': 'Trainer',
            'to': 'Intermediate-Model',
            'points': [
              {'x': 178, 'y': 136.93333333333334},
              {'x': 178, 'y': 166.93333333333334},
              {'x': 178, 'y': 196.93333333333334}
            ]
          },
          {
            'from': 'Intermediate-Model',
            'to': 'Test for accuracy',
            'points': [
              {'x': 178, 'y': 235.33333333333331},
              {'x': 178, 'y': 265.33333333333337},
              {'x': 178, 'y': 295.33333333333337}
            ]
          }
        ],
        'groups': [],
        'state': 'TIMEOUT',
        'description': '',
        'descriptionTooltip': '',
        'hasControlNode': false,
        'treatAsLoop': false,
        'conditionalQuery': '',
        'callout': '',
        'modifiers': {},
        'stateTooltip': '',
        'iconTooltip': '',
        'options': {},
        'artifactRefs': [],
        'x': -1,
        'y': -1,
        'cssTransform': '',
        'width': 0,
        'height': 0,
        'expanded': false,
        'hidden': false
      },
      'expandedDims': {'width': 379.3333333333333, 'height': 375.33333333333337}
    },
    {
      'id': 'sub2',
      'displayName': 'Log Ingestion (sub2)',
      'nodes': [
        {
          'id': 'Scan Texts',
          'displayName': '',
          'type': 'execution',
          'state': 'SUCCEEDED',
          'stateTooltip': '',
          'iconTooltip': '',
          'conditionalQuery': '',
          'modifiers': {},
          'callout': '',
          'options': {},
          'description': '',
          'descriptionTooltip': '',
          'artifactRefs':
              [{'id': 'Text', 'path': []}, {'id': 'Text2', 'path': []}],
          'x': 166,
          'y': 75.33333333333334,
          'width': 284,
          'height': 56,
          'cssTransform':
              'translate(calc(166px - 50%), calc(75.33333333333334px - 50%))',
          'icon': {
            'name': 'execution',
            'iconset': 'cloud_ai',
            'iconColors': 'normal',
            'color': '#1A73E8',
            'contrastColor': 'white',
            'size': 'large'
          },
          'origIcon': {}
        },
        {
          'id': 'Label Execution Logs',
          'displayName': '',
          'type': 'execution',
          'state': 'RUNNING',
          'stateTooltip': '',
          'iconTooltip': '',
          'conditionalQuery': '',
          'modifiers': {},
          'callout': '',
          'options': {},
          'description': '',
          'descriptionTooltip': '',
          'artifactRefs':
              [{'id': 'Text', 'path': []}, {'id': 'Entities', 'path': []}],
          'x': 490,
          'y': 75.33333333333334,
          'width': 284,
          'height': 56,
          'cssTransform':
              'translate(calc(490px - 50%), calc(75.33333333333334px - 50%))',
          'icon': {
            'name': 'execution',
            'iconset': 'cloud_ai',
            'iconColors': 'normal',
            'color': '#1A73E8',
            'contrastColor': 'white',
            'size': 'large'
          },
          'origIcon': {}
        },
        {
          'id': 'Text Logs',
          'displayName': '',
          'type': 'artifact',
          'state': 'NO_STATE_RUNTIME',
          'stateTooltip': '',
          'iconTooltip': '',
          'conditionalQuery': '',
          'modifiers': {},
          'callout': '',
          'options': {},
          'description': '',
          'descriptionTooltip': '',
          'artifactRefs': [],
          'x': 166,
          'y': 182.53333333333333,
          'width': 38.400000000000006,
          'height': 38.400000000000006,
          'cssTransform':
              'translate(calc(166px - 50%), calc(182.53333333333333px - 50%))',
          'icon': {
            'name': 'logs',
            'iconset': 'shell',
            'iconColors': 'normal',
            'color': '#fbbc04',
            'contrastColor': 'white',
            'size': 'small'
          },
          'origIcon': {'name': 'logs', 'iconset': 'shell', 'size': 'small'}
        },
        {
          'id': 'Execution Logs',
          'displayName': '',
          'type': 'artifact',
          'state': 'NO_STATE_RUNTIME',
          'stateTooltip': '',
          'iconTooltip': '',
          'conditionalQuery': '',
          'modifiers': {},
          'callout': '',
          'options': {},
          'description': '',
          'descriptionTooltip': '',
          'artifactRefs': [],
          'x': 490,
          'y': 182.53333333333333,
          'width': 38.400000000000006,
          'height': 38.400000000000006,
          'cssTransform':
              'translate(calc(490px - 50%), calc(182.53333333333333px - 50%))',
          'icon': {
            'name': 'logs',
            'iconset': 'shell',
            'iconColors': 'normal',
            'color': '#fbbc04',
            'contrastColor': 'white',
            'size': 'small'
          },
          'origIcon': {'name': 'logs', 'iconset': 'shell', 'size': 'small'}
        }
      ],
      'edges': [
        {
          'from': 'Scan Texts',
          'to': 'Text Logs',
          'points': [
            {'x': 166, 'y': 103.33333333333334},
            {'x': 166, 'y': 133.33333333333334},
            {'x': 166, 'y': 163.33333333333331}
          ]
        },
        {
          'from': 'Label Execution Logs',
          'to': 'Execution Logs',
          'points': [
            {'x': 490, 'y': 103.33333333333334},
            {'x': 490, 'y': 133.33333333333334},
            {'x': 490, 'y': 163.33333333333331}
          ]
        }
      ],
      'groups': [],
      'state': 'RUNNING',
      'description': 'A simple subdag that shows edge-snapping logic above it',
      'descriptionTooltip': '',
      'hasControlNode': true,
      'treatAsLoop': false,
      'conditionalQuery': '',
      'callout': '',
      'modifiers': {},
      'stateTooltip': '',
      'iconTooltip': '',
      'options': {},
      'artifactRefs': [],
      'x': 2100.7833333333333,
      'y': 1444.6333333333332,
      'cssTransform':
          'translate(calc(2100.7833333333333px - 50%), calc(1458.6333333333332px - 50%))',
      'width': 679.3333333333334,
      'height': 262.5333333333333,
      'expanded': true,
      'padY': 28,
      'expandedDims': {'width': 679.3333333333334, 'height': 234.53333333333333}
    }
  ],
  nodes: [
    {
      'id': 'BQ',
      'displayName': 'BigQuery Fetcher',
      'type': 'execution',
      'state': 'SKIPPED',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '',
      'modifiers': {},
      'callout': '',
      'options': {},
      'description': 'ai_model_data',
      'descriptionTooltip': '',
      'artifactRefs': [],
      'x': 1398.9499999999998,
      'y': 94,
      'width': 284,
      'height': 56,
      'cssTransform':
          'translate(calc(1398.9499999999998px - 50%), calc(94px - 50%))',
      'icon': {
        'text': 'BQ',
        'iconset': 'cloud_ai',
        'iconColors': 'inverted',
        'color': '#1A73E8',
        'contrastColor': 'white',
        'size': 'large'
      },
      'origIcon': {'text': 'BQ', 'iconColors': 'inverted'}
    },
    {
      'id': 'Transforms',
      'displayName': 'Dataproc Transforms',
      'type': 'execution',
      'state': 'SUCCEEDED',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '',
      'modifiers': {},
      'callout': '',
      'options': {},
      'description': '/api/fn_clean_data',
      'descriptionTooltip': '',
      'artifactRefs': [],
      'x': 1398.9499999999998,
      'y': 210,
      'width': 284,
      'height': 56,
      'cssTransform':
          'translate(calc(1398.9499999999998px - 50%), calc(210px - 50%))',
      'icon': {
        'text': 'HTTP',
        'iconset': 'cloud_ai',
        'iconColors': 'inverted',
        'color': '#1A73E8',
        'contrastColor': 'white',
        'size': 'large'
      },
      'origIcon': {'text': 'HTTP', 'iconColors': 'inverted'}
    },
    {
      'id': 'TransformedTable',
      'displayName': '',
      'type': 'artifact',
      'state': 'NO_STATE_RUNTIME',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '',
      'modifiers': {},
      'callout': '',
      'options': {},
      'description': '',
      'descriptionTooltip': '',
      'artifactRefs': [],
      'x': 1398.9499999999998,
      'y': 317.2,
      'width': 38.400000000000006,
      'height': 38.400000000000006,
      'cssTransform':
          'translate(calc(1398.9499999999998px - 50%), calc(317.2px - 50%))',
      'icon': {
        'name': 'artifact-generic',
        'iconset': 'cloud_ai',
        'iconColors': 'normal',
        'color': '#fbbc04',
        'contrastColor': 'white',
        'size': 'large'
      },
      'origIcon': {}
    },
    {
      'id': 'Big Query table',
      'displayName': '',
      'type': 'execution',
      'state': 'CANCELLED',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '',
      'modifiers': {},
      'callout': '',
      'options': {},
      'description': '',
      'descriptionTooltip': '',
      'artifactRefs': [],
      'x': 479.83333333333326,
      'y': 424.4,
      'width': 284,
      'height': 56,
      'cssTransform':
          'translate(calc(479.83333333333326px - 50%), calc(424.4px - 50%))',
      'icon': {
        'name': 'execution',
        'iconset': 'cloud_ai',
        'iconColors': 'normal',
        'color': '#1A73E8',
        'contrastColor': 'white',
        'size': 'large'
      },
      'origIcon': {}
    },
    {
      'id': 'Broadcast Table',
      'displayName': '',
      'type': 'execution',
      'state': 'SUCCEEDED',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '',
      'modifiers': {},
      'callout': '',
      'options': {},
      'description': 'Using a custom execution icon',
      'descriptionTooltip': '',
      'artifactRefs': [],
      'x': 1960.7416666666666,
      'y': 424.4,
      'width': 284,
      'height': 56,
      'cssTransform':
          'translate(calc(1960.7416666666666px - 50%), calc(424.4px - 50%))',
      'icon': {
        'name': 'performance-dashboard',
        'iconset': 'shell',
        'iconColors': 'normal',
        'color': '#1A73E8',
        'contrastColor': 'white',
        'size': 'small'
      },
      'subType': 'process node',
      'origIcon':
          {'name': 'performance-dashboard', 'iconset': 'shell', 'size': 'small'}
    },
    {
      'id': 'BigTable',
      'displayName': 'Big Table Artifact',
      'type': 'artifact',
      'state': 'NO_STATE_RUNTIME',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '',
      'modifiers': {},
      'callout': '',
      'options': {},
      'description': '',
      'descriptionTooltip': '',
      'artifactRefs': [],
      'x': 479.83333333333326,
      'y': 540.4,
      'width': 38.400000000000006,
      'height': 38.400000000000006,
      'cssTransform':
          'translate(calc(479.83333333333326px - 50%), calc(540.4px - 50%))',
      'icon': {
        'name': 'artifact-model',
        'iconset': 'cloud_ai',
        'iconColors': 'normal',
        'color': '#fbbc04',
        'contrastColor': 'white',
        'size': 'large'
      },
      'origIcon':
          {'name': 'artifact-model', 'iconset': 'cloud_ai', 'size': 'large'}
    },
    {
      'id': 'Email',
      'displayName': 'Email (deleted)',
      'type': 'artifact',
      'state': 'NO_STATE_STATIC',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '',
      'modifiers': {},
      'callout': 'deleted',
      'options': {},
      'description': 'Email sent to management',
      'descriptionTooltip': '',
      'artifactRefs': [],
      'x': 1701.5083333333332,
      'y': 1444.6333333333332,
      'width': 38.400000000000006,
      'height': 38.400000000000006,
      'cssTransform':
          'translate(calc(1701.5083333333332px - 50%), calc(1444.6333333333332px - 50%))',
      'icon': {
        'name': 'web',
        'iconset': 'shell',
        'iconColors': 'normal',
        'color': '#fbbc04',
        'contrastColor': 'white',
        'size': 'small'
      },
      'origIcon': {'name': 'web', 'iconset': 'shell', 'size': 'small'}
    },
    {
      'id': 'Text2',
      'displayName': '',
      'type': 'artifact',
      'state': 'NO_STATE_RUNTIME',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '',
      'modifiers': {},
      'callout': '',
      'options': {},
      'description': 'PagerDuty text2',
      'descriptionTooltip': '',
      'artifactRefs': [],
      'x': 1882.3416666666665,
      'y': 830.0666666666666,
      'width': 38.400000000000006,
      'height': 38.400000000000006,
      'cssTransform':
          'translate(calc(1882.3416666666665px - 50%), calc(830.0666666666666px - 50%))',
      'icon': {
        'name': 'topic',
        'iconset': 'shell',
        'iconColors': 'normal',
        'color': '#fbbc04',
        'contrastColor': 'white',
        'size': 'small'
      },
      'origIcon': {'name': 'topic', 'iconset': 'shell', 'size': 'small'}
    },
    {
      'id': 'Text',
      'displayName': '',
      'type': 'artifact',
      'state': 'NO_STATE_RUNTIME',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '',
      'modifiers': {},
      'callout': '',
      'options': {},
      'description': 'PagerDuty text',
      'descriptionTooltip': '',
      'artifactRefs': [],
      'x': 1960.7416666666666,
      'y': 830.0666666666666,
      'width': 38.400000000000006,
      'height': 38.400000000000006,
      'cssTransform':
          'translate(calc(1960.7416666666666px - 50%), calc(830.0666666666666px - 50%))',
      'icon': {
        'name': 'topic',
        'iconset': 'shell',
        'iconColors': 'normal',
        'color': '#fbbc04',
        'contrastColor': 'white',
        'size': 'small'
      },
      'origIcon': {'name': 'topic', 'iconset': 'shell', 'size': 'small'}
    },
    {
      'id': 'Extract Entities',
      'displayName': '',
      'type': 'execution',
      'state': 'SKIPPED',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '',
      'modifiers': {},
      'callout': '',
      'options': {},
      'description': '',
      'descriptionTooltip': '',
      'artifactRefs': [],
      'x': 2262.5416666666665,
      'y': 540.4,
      'width': 284,
      'height': 56,
      'cssTransform':
          'translate(calc(2262.5416666666665px - 50%), calc(540.4px - 50%))',
      'icon': {
        'name': 'execution',
        'iconset': 'cloud_ai',
        'iconColors': 'normal',
        'color': '#1A73E8',
        'contrastColor': 'white',
        'size': 'large'
      },
      'origIcon': {}
    },
    {
      'id': 'AutoML Tables',
      'displayName': '',
      'type': 'execution',
      'state': 'FAILED',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '',
      'modifiers': {},
      'callout': '',
      'options': {},
      'description': '',
      'descriptionTooltip': '',
      'artifactRefs': [],
      'x': 294,
      'y': 830.0666666666666,
      'width': 284,
      'height': 56,
      'cssTransform':
          'translate(calc(294px - 50%), calc(830.0666666666666px - 50%))',
      'icon': {
        'name': 'execution',
        'iconset': 'cloud_ai',
        'iconColors': 'normal',
        'color': '#1A73E8',
        'contrastColor': 'white',
        'size': 'large'
      },
      'origIcon': {}
    },
    {
      'id': 'Send via APIs',
      'displayName': '',
      'type': 'execution',
      'state': 'PENDING',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '',
      'modifiers': {},
      'callout': {
        'text': 'This is a simple callout that goes on for way to long',
        'bg': '#1a73e8',
        'color': 'white'
      },
      'options': {},
      'description': '',
      'descriptionTooltip': '',
      'artifactRefs': [
        {'id': 'Text Logs', 'path': ['sub2']},
        {'id': 'Execution Logs', 'path': ['sub2']}
      ],
      'x': 1861.9083333333333,
      'y': 1932.5333333333333,
      'width': 284,
      'height': 56,
      'cssTransform':
          'translate(calc(1861.9083333333333px - 50%), calc(1932.5333333333333px - 50%))',
      'icon': {
        'name': 'execution',
        'iconset': 'cloud_ai',
        'iconColors': 'normal',
        'color': '#1A73E8',
        'contrastColor': 'white',
        'size': 'large'
      },
      'origIcon': {}
    },
    {
      'id': 'Scan for Importance',
      'displayName': '',
      'type': 'execution',
      'state': 'SKIPPED',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '',
      'modifiers': {},
      'callout': '',
      'options': {},
      'description': '',
      'descriptionTooltip': '',
      'artifactRefs': [],
      'x': 2161.9416666666666,
      'y': 830.0666666666666,
      'width': 284,
      'height': 56,
      'cssTransform':
          'translate(calc(2161.9416666666666px - 50%), calc(830.0666666666666px - 50%))',
      'icon': {
        'name': 'execution',
        'iconset': 'cloud_ai',
        'iconColors': 'normal',
        'color': '#1A73E8',
        'contrastColor': 'white',
        'size': 'large'
      },
      'origIcon': {}
    },
    {
      'id': 'Entities',
      'displayName': '',
      'type': 'artifact',
      'state': 'NO_STATE_RUNTIME',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '',
      'modifiers': {},
      'callout': '',
      'options': {},
      'description': 'People: 512, Places: 82, Indexes: 4012',
      'descriptionTooltip': '',
      'artifactRefs': [],
      'x': 2363.1416666666664,
      'y': 830.0666666666666,
      'width': 38.400000000000006,
      'height': 38.400000000000006,
      'cssTransform':
          'translate(calc(2363.1416666666664px - 50%), calc(830.0666666666666px - 50%))',
      'icon': {
        'text': 'ENT',
        'iconset': 'cloud_ai',
        'iconColors': 'inverted',
        'color': '#52cee6',
        'contrastColor': 'white',
        'size': 'large'
      },
      'origIcon': {'text': 'ENT', 'iconColors': 'inverted', 'color': '#52cee6'}
    },
    {
      'id': 'Output to BigQuery',
      'displayName': '',
      'type': 'execution',
      'state': 'RUNNING',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '',
      'modifiers': {},
      'callout': '',
      'options': {},
      'description': '',
      'descriptionTooltip': '',
      'artifactRefs': [],
      'x': 296,
      'y': 1444.6333333333332,
      'width': 284,
      'height': 56,
      'cssTransform':
          'translate(calc(296px - 50%), calc(1444.6333333333332px - 50%))',
      'icon': {
        'name': 'execution',
        'iconset': 'cloud_ai',
        'iconColors': 'normal',
        'color': '#1A73E8',
        'contrastColor': 'white',
        'size': 'large'
      },
      'origIcon': {}
    },
    {
      'id': 'BigQueryTable',
      'displayName': '',
      'type': 'artifact',
      'state': 'NO_STATE_RUNTIME',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '',
      'modifiers': {},
      'callout': '',
      'options': {},
      'description': '',
      'descriptionTooltip': '',
      'artifactRefs': [],
      'x': 296,
      'y': 1932.5333333333333,
      'width': 38.400000000000006,
      'height': 38.400000000000006,
      'cssTransform':
          'translate(calc(296px - 50%), calc(1932.5333333333333px - 50%))',
      'icon': {
        'name': 'artifact-datasets',
        'iconset': 'cloud_ai',
        'iconColors': 'normal',
        'color': '#af5cf7',
        'contrastColor': 'white',
        'size': 'large'
      },
      'origIcon': {
        'name': 'artifact-datasets',
        'iconset': 'cloud_ai',
        'size': 'large',
        'color': '#af5cf7'
      }
    },
    {
      'id': 'CreateFinal',
      'displayName': '',
      'type': 'execution',
      'state': 'NO_STATE_STATIC',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '1 == 1',
      'modifiers': {},
      'callout': '',
      'options': {},
      'description': '',
      'descriptionTooltip': '',
      'artifactRefs': [
        {'id': 'BigTable', 'path': ['sub1']},
        {'id': 'BigTable', 'path': ['sub1', 'subn1']}
      ],
      'x': 316.5999999999999,
      'y': 2095.5333333333333,
      'width': 272,
      'height': 56,
      'cssTransform':
          'translate(calc(316.5999999999999px - 50%), calc(2095.5333333333333px - 50%))',
      'icon': {
        'name': 'execution',
        'iconset': 'cloud_ai',
        'iconColors': 'normal',
        'color': '#1A73E8',
        'contrastColor': 'white',
        'size': 'large'
      },
      'origIcon': {}
    },
    {
      'id': 'CustomNode1',
      'displayName': '',
      'type': 'execution',
      'state': 'NO_STATE_STATIC',
      'stateTooltip': '',
      'iconTooltip': '',
      'conditionalQuery': '',
      'modifiers': {},
      'callout': '',
      'options': {},
      'description': '',
      'descriptionTooltip': '',
      'artifactRefs': [{'id': 'BigTable', 'path': ['sub1']}],
      'x': 1189.9499999999998,
      'y': 1932.5333333333333,
      'width': 480,
      'height': 150,
      'cssTransform':
          'translate(calc(1189.9499999999998px - 50%), calc(1932.5333333333333px - 50%))',
      'icon': {
        'name': 'execution',
        'iconset': 'cloud_ai',
        'iconColors': 'normal',
        'color': '#1A73E8',
        'contrastColor': 'white',
        'size': 'large'
      },
      'includeInStepCount': false,
      'hideEdgeMarkers': false,
      'templateRef': 'outlineBasic',
      'origIcon': {}
    }
  ]
} as unknown as GraphSpec;
