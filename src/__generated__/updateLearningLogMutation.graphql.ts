/**
 * @generated SignedSource<<de7c81beff1c70378250d96fc4d578c0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type UpdateLearningLogInput = {
  id: string;
  reflection?: string | null | undefined;
  sourceUrl?: string | null | undefined;
  tags?: ReadonlyArray<string> | null | undefined;
  timeSpent?: number | null | undefined;
  title?: string | null | undefined;
};
export type updateLearningLogMutation$variables = {
  input: UpdateLearningLogInput;
};
export type updateLearningLogMutation$data = {
  readonly updateLearningLog: {
    readonly log: {
      readonly id: string;
      readonly " $fragmentSpreads": FragmentRefs<"learningLogFragments_learningLogItem">;
    };
  };
};
export type updateLearningLogMutation = {
  response: updateLearningLogMutation$data;
  variables: updateLearningLogMutation$variables;
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
    "name": "updateLearningLogMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "UpdateLearningLogPayload",
        "kind": "LinkedField",
        "name": "updateLearningLog",
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
    "name": "updateLearningLogMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "UpdateLearningLogPayload",
        "kind": "LinkedField",
        "name": "updateLearningLog",
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
    "cacheID": "ac4c1206216e3c97741632adb563c2d6",
    "id": null,
    "metadata": {},
    "name": "updateLearningLogMutation",
    "operationKind": "mutation",
    "text": "mutation updateLearningLogMutation(\n  $input: UpdateLearningLogInput!\n) {\n  updateLearningLog(input: $input) {\n    log {\n      id\n      ...learningLogFragments_learningLogItem\n    }\n  }\n}\n\nfragment learningLogFragments_learningLogItem on LearningLog {\n  id\n  title\n  reflection\n  tags\n  timeSpent\n  sourceUrl\n  createdAt\n}\n"
  }
};
})();

(node as any).hash = "90f1ce2d14b28aaffac2df44103b94a9";

export default node;
