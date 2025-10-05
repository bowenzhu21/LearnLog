/**
 * @generated SignedSource<<a0f414e08960972b0d20604ece204cc7>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type CreateLearningLogInput = {
  reflection: string;
  sourceUrl?: string | null | undefined;
  tags: ReadonlyArray<string>;
  timeSpent: number;
  title: string;
};
export type createLearningLogMutation$variables = {
  input: CreateLearningLogInput;
};
export type createLearningLogMutation$data = {
  readonly createLearningLog: {
    readonly log: {
      readonly id: string;
      readonly " $fragmentSpreads": FragmentRefs<"learningLogFragments_learningLogItem">;
    };
  };
};
export type createLearningLogMutation = {
  response: createLearningLogMutation$data;
  variables: createLearningLogMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "input",
    "variableName": "input"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "createLearningLogMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "CreateLearningLogPayload",
        "kind": "LinkedField",
        "name": "createLearningLog",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "LearningLog",
            "kind": "LinkedField",
            "name": "log",
            "plural": false,
            "selections": [
              (v2/*: any*/),
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "learningLogFragments_learningLogItem"
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "createLearningLogMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "CreateLearningLogPayload",
        "kind": "LinkedField",
        "name": "createLearningLog",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "LearningLog",
            "kind": "LinkedField",
            "name": "log",
            "plural": false,
            "selections": [
              (v2/*: any*/),
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
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "e689d26d4f4770b227b58c5b8632d069",
    "id": null,
    "metadata": {},
    "name": "createLearningLogMutation",
    "operationKind": "mutation",
    "text": "mutation createLearningLogMutation(\n  $input: CreateLearningLogInput!\n) {\n  createLearningLog(input: $input) {\n    log {\n      id\n      ...learningLogFragments_learningLogItem\n    }\n  }\n}\n\nfragment learningLogFragments_learningLogItem on LearningLog {\n  id\n  title\n  reflection\n  tags\n  timeSpent\n  sourceUrl\n  createdAt\n}\n"
  }
};
})();

(node as any).hash = "41d3a77d6b0b7d0819c914d808aa6610";

export default node;
