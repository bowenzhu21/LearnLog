import { headers } from "next/headers";
import {
  Environment,
  Network,
  RecordSource,
  Store,
  type FetchFunction,
  type GraphQLResponse,
} from "relay-runtime";

const fetchGraphQL: FetchFunction = async (operation, variables) => {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const endpoint = `${protocol}://${host}/api/graphql`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: operation.text,
      variables,
    }),
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}\n${errorBody}`);
  }

  return (await response.json()) as GraphQLResponse;
};

export function createServerEnvironment() {
  return new Environment({
    network: Network.create(fetchGraphQL),
    store: new Store(new RecordSource()),
    isServer: true,
  });
}
