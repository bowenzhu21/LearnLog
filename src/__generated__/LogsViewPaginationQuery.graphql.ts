/**
 * @generated SignedSource<<3ae0cd546ae52b146ac5191705b8e026>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type LearningLogFilter = {
  from?: string | null | undefined;
  q?: string | null | undefined;
  tagsAll?: ReadonlyArray<string> | null | undefined;
  tagsAny?: ReadonlyArray<string> | null | undefined;
  to?: string | null | undefined;
};
export type LogsViewPaginationQuery$variables = {
  after?: string | null | undefined;
  filter?: LearningLogFilter | null | undefined;
  first: number;
};
export type LogsViewPaginationQuery$data = {
  readonly " $fragmentSpreads": FragmentRefs<"LogsView_query">;
};
export type LogsViewPaginationQuery = {
  response: LogsViewPaginationQuery$data;
  variables: LogsViewPaginationQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "after"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "filter"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "first"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "after",
    "variableName": "after"
  },
  {
    "kind": "Variable",
    "name": "filter",
    "variableName": "filter"
  },
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "first"
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "LogsViewPaginationQuery",
    "selections": [
      {
        "args": (v1/*: any*/),
        "kind": "FragmentSpread",
        "name": "LogsView_query"
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "LogsViewPaginationQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "LearningLogConnection",
        "kind": "LinkedField",
        "name": "learningLogs",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "LearningLogEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "LearningLog",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "id",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "title",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "reflection",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "tags",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "timeSpent",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "sourceUrl",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "createdAt",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "__typename",
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "cursor",
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "PageInfo",
            "kind": "LinkedField",
            "name": "pageInfo",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "hasNextPage",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "hasPreviousPage",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "startCursor",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "endCursor",
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": (v1/*: any*/),
        "filters": [
          "filter"
        ],
        "handle": "connection",
        "key": "LogsView_learningLogs",
        "kind": "LinkedHandle",
        "name": "learningLogs"
      }
    ]
  },
  "params": {
    "cacheID": "951aadd86ab9e4f771812f386ca72d8d",
    "id": null,
    "metadata": {},
    "name": "LogsViewPaginationQuery",
    "operationKind": "query",
    "text": "query LogsViewPaginationQuery(\n  $after: String\n  $filter: LearningLogFilter\n  $first: Int!\n) {\n  ...LogsView_query_G9cLv\n}\n\nfragment LogsView_query_G9cLv on Query {\n  learningLogs(first: $first, after: $after, filter: $filter) {\n    edges {\n      node {\n        id\n        ...learningLogFragments_learningLogItem\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}\n\nfragment learningLogFragments_learningLogItem on LearningLog {\n  id\n  title\n  reflection\n  tags\n  timeSpent\n  sourceUrl\n  createdAt\n}\n"
  }
};
})();

(node as any).hash = "9c596706fe3722f1eb47b44083fe0646";

export default node;
