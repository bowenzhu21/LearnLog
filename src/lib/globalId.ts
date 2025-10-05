const SEPARATOR = ":";

export function toGlobalId(typename: string, id: string): string {
  if (!typename || !id) {
    throw new Error("Both typename and id are required");
  }

  const raw = `${typename}${SEPARATOR}${id}`;
  return Buffer.from(raw, "utf8").toString("base64");
}

export function fromGlobalId(globalId: string): { typename: string; id: string } {
  if (!globalId) {
    throw new Error("Global ID is required");
  }

  let decoded: string;
  try {
    decoded = Buffer.from(globalId, "base64").toString("utf8");
  } catch {
    throw new Error("Invalid global ID encoding");
  }

  const separatorIndex = decoded.indexOf(SEPARATOR);
  if (separatorIndex <= 0 || separatorIndex === decoded.length - 1) {
    throw new Error("Invalid global ID format");
  }

  return {
    typename: decoded.slice(0, separatorIndex),
    id: decoded.slice(separatorIndex + 1),
  };
}

export function asLearningLogId(id: string): string {
  return toGlobalId("LearningLog", id);
}
