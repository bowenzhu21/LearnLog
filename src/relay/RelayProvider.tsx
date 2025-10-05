"use client";

import { ReactNode, useMemo } from "react";
import { RelayEnvironmentProvider } from "react-relay";
import { Environment, Network, RecordSource, Store, type FetchFunction } from "relay-runtime";

const fetchGraphQL: FetchFunction = async (operation, variables) => {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: operation.text,
      variables,
    }),
  });

  const json = await response.json();
  if (json.errors) {
    throw json.errors[0];
  }
  return json;
};

const createEnvironment = () =>
  new Environment({
    network: Network.create(fetchGraphQL),
    store: new Store(new RecordSource()),
  });

export default function RelayProvider({ children }: { children: ReactNode }) {
  const environment = useMemo(() => createEnvironment(), []);

  return <RelayEnvironmentProvider environment={environment}>{children}</RelayEnvironmentProvider>;
}
