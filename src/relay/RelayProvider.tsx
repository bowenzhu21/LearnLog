"use client";

import { ReactNode, useMemo } from "react";
import { RelayEnvironmentProvider } from "react-relay";
import { Environment, Network, RecordSource, Store, type FetchFunction } from "relay-runtime";

const resolveEndpoint = () => {
  if (typeof window !== "undefined") {
    return "/api/graphql";
  }

  const explicit = process.env.NEXT_PUBLIC_SITE_URL ?? null;
  if (explicit) {
    return `${explicit.replace(/\/$/, "")}/api/graphql`;
  }

  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  if (vercelUrl) {
    return `${vercelUrl.replace(/\/$/, "")}/api/graphql`;
  }

  return "http://localhost:3000/api/graphql";
};

const fetchGraphQL: FetchFunction = async (operation, variables) => {
  const endpoint = resolveEndpoint();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: operation.text,
      variables,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}\n${message}`);
  }

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
