/**
 * @generated SignedSource<<2c1fefc0ca49c34b1cab4d46882e060e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type learningLogFragments_learningLogItem$data = {
  readonly createdAt: string;
  readonly id: string;
  readonly reflection: string;
  readonly sourceUrl: string | null | undefined;
  readonly tags: ReadonlyArray<string>;
  readonly timeSpent: number;
  readonly title: string;
  readonly " $fragmentType": "learningLogFragments_learningLogItem";
};
export type learningLogFragments_learningLogItem$key = {
  readonly " $data"?: learningLogFragments_learningLogItem$data;
  readonly " $fragmentSpreads": FragmentRefs<"learningLogFragments_learningLogItem">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "learningLogFragments_learningLogItem",
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
    }
  ],
  "type": "LearningLog",
  "abstractKey": null
};

(node as any).hash = "dd1bbc190803d73f1740b960efe9012a";

export default node;
