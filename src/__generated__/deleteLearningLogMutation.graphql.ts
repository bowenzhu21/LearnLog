/**
 * @generated SignedSource<<4c7032ee53374b6330bbdb125775d083>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DeleteLearningLogInput = {
  id: string;
};
export type deleteLearningLogMutation$variables = {
  input: DeleteLearningLogInput;
};
export type deleteLearningLogMutation$data = {
  readonly deleteLearningLog: {
    readonly deletedId: string;
  };
};
export type deleteLearningLogMutation = {
  response: deleteLearningLogMutation$data;
  variables: deleteLearningLogMutation$variables;
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
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "DeleteLearningLogPayload",
    "kind": "LinkedField",
    "name": "deleteLearningLog",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "deletedId",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "deleteLearningLogMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "deleteLearningLogMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "1755f6488bb69ded7913dc31b3d9e55e",
    "id": null,
    "metadata": {},
    "name": "deleteLearningLogMutation",
    "operationKind": "mutation",
    "text": "mutation deleteLearningLogMutation(\n  $input: DeleteLearningLogInput!\n) {\n  deleteLearningLog(input: $input) {\n    deletedId\n  }\n}\n"
  }
};
})();

(node as any).hash = "b29a72d9814170e33aeeba2e6c1de676";

export default node;
