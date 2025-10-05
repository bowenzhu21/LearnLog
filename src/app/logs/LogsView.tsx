"use client";

import { Dispatch, FormEvent, SetStateAction, useMemo, useState } from "react";
import {
  ConnectionHandler,
  ROOT_ID,
  graphql,
  useLazyLoadQuery,
  useMutation,
  usePaginationFragment,
  useFragment,
} from "react-relay";
import type { RecordSourceSelectorProxy } from "relay-runtime";

import { learningLogsQuery } from "@/relay/queries/learningLogsQuery";
import { learningLogItemFragment } from "@/relay/learningLogFragments";
import { createLearningLogMutation } from "@/relay/mutations/createLearningLogMutation";
import { updateLearningLogMutation } from "@/relay/mutations/updateLearningLogMutation";
import { deleteLearningLogMutation } from "@/relay/mutations/deleteLearningLogMutation";
import {
  learningLogCreateSchema,
  learningLogUpdateSchema,
  type LearningLogCreateInput,
  type LearningLogUpdateInput,
} from "@/lib/validation";
import type { learningLogsQuery as LearningLogsQueryType } from "@/__generated__/learningLogsQuery.graphql";
import type { LogsView_query$key } from "@/__generated__/LogsView_query.graphql";
import type { LogsViewPaginationQuery } from "@/__generated__/LogsViewPaginationQuery.graphql";
import type { learningLogFragments_learningLogItem$key } from "@/__generated__/learningLogFragments_learningLogItem.graphql";

const DEFAULT_PAGE_SIZE = 10;

type FilterFormState = {
  q: string;
  tagsAny: string;
  tagsAll: string;
  from: string;
  to: string;
};

type LearningLogFilterInput = {
  q?: string;
  tagsAny?: string[];
  tagsAll?: string[];
  from?: string;
  to?: string;
};

type CreateFormState = {
  title: string;
  reflection: string;
  tags: string;
  timeSpent: string;
  sourceUrl: string;
};

type MutationError = string | null;

type LearningLogShape = {
  id: string;
  title: string;
  reflection: string;
  tags: readonly string[];
  timeSpent: number;
  sourceUrl: string | null;
  createdAt: string;
};

const logsViewFragment = graphql`
  fragment LogsView_query on Query
  @argumentDefinitions(
    first: { type: "Int!" }
    after: { type: "String" }
    filter: { type: "LearningLogFilter" }
  )
  @refetchable(queryName: "LogsViewPaginationQuery") {
    learningLogs(first: $first, after: $after, filter: $filter)
      @connection(key: "LogsView_learningLogs", filters: ["filter"]) {
      edges {
        node {
          id
          ...learningLogFragments_learningLogItem
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

const initialCreateState: CreateFormState = {
  title: "",
  reflection: "",
  tags: "",
  timeSpent: "30",
  sourceUrl: "",
};

const initialFilterState: FilterFormState = {
  q: "",
  tagsAny: "",
  tagsAll: "",
  from: "",
  to: "",
};

const parseCsv = (value: string): string[] =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const buildFilterInput = (state: FilterFormState): LearningLogFilterInput | null => {
  const filter: LearningLogFilterInput = {};
  const tagsAny = parseCsv(state.tagsAny);
  const tagsAll = parseCsv(state.tagsAll);

  if (state.q.trim()) {
    filter.q = state.q.trim();
  }
  if (tagsAny.length > 0) {
    filter.tagsAny = tagsAny;
  }
  if (tagsAll.length > 0) {
    filter.tagsAll = tagsAll;
  }
  if (state.from) {
    filter.from = new Date(state.from).toISOString();
  }
  if (state.to) {
    filter.to = new Date(state.to).toISOString();
  }

  return Object.keys(filter).length > 0 ? filter : null;
};

const CONNECTION_KEY = "LogsView_learningLogs";

const getConnectionFilters = (filter: LearningLogFilterInput | null) => ({
  filter: filter ?? null,
});

const createTempId = () => `client:new-log:${Date.now()}`;

export default function LogsView() {
  const [filterForm, setFilterForm] = useState<FilterFormState>(initialFilterState);
  const [activeFilter, setActiveFilter] = useState<LearningLogFilterInput | null>(null);
  const [createForm, setCreateForm] = useState<CreateFormState>(initialCreateState);
  const [createError, setCreateError] = useState<MutationError>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CreateFormState>(initialCreateState);
  const [editError, setEditError] = useState<MutationError>(null);
  const [deleteError, setDeleteError] = useState<MutationError>(null);

  const baseData = useLazyLoadQuery<LearningLogsQueryType>(learningLogsQuery, {
    first: DEFAULT_PAGE_SIZE,
    filter: null,
  });

  const { data, hasNext, isLoadingNext, loadNext, refetch } = usePaginationFragment<
    LogsViewPaginationQuery,
    LogsView_query$key
  >(logsViewFragment, baseData);

  const [commitCreate, isCreateInFlight] = useMutation(createLearningLogMutation);
  const [commitUpdate, isUpdateInFlight] = useMutation(updateLearningLogMutation);
  const [commitDelete, isDeleteInFlight] = useMutation(deleteLearningLogMutation);

  const logs = useMemo(() => {
    const connectionEdges = data.learningLogs?.edges ?? [];
    return connectionEdges.map((edge) => edge?.node).filter(Boolean) as learningLogFragments_learningLogItem$key[];
  }, [data.learningLogs?.edges]);

  const connectionFilters = useMemo(() => getConnectionFilters(activeFilter), [activeFilter]);

  const resetCreateForm = () => {
    setCreateForm(initialCreateState);
    setCreateError(null);
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);

    const tags = parseCsv(createForm.tags);
    const timeSpent = Number(createForm.timeSpent);

    let payload: LearningLogCreateInput;
    try {
      payload = learningLogCreateSchema.parse({
        title: createForm.title,
        reflection: createForm.reflection,
        tags,
        timeSpent,
        sourceUrl: createForm.sourceUrl || undefined,
      });
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Invalid input");
      return;
    }

    const optimisticId = createTempId();
    const now = new Date().toISOString();

    const insertIntoConnection = (store: RecordSourceSelectorProxy, recordId: string) => {
      const root = store.get(ROOT_ID);
      if (!root) {
        return;
      }
      const connection = ConnectionHandler.getConnection(root, CONNECTION_KEY, connectionFilters);
      if (!connection) {
        return;
      }
      const record = store.get(recordId);
      if (!record) {
        return;
      }
      const edge = ConnectionHandler.createEdge(store, connection, record, "LearningLogEdge");
      ConnectionHandler.insertEdgeBefore(connection, edge);
    };

    commitCreate({
      variables: {
        input: {
          title: payload.title,
          reflection: payload.reflection,
          tags: payload.tags,
          timeSpent: payload.timeSpent,
          sourceUrl: payload.sourceUrl ?? null,
        },
      },
      optimisticResponse: {
        createLearningLog: {
          log: {
            id: optimisticId,
            title: payload.title,
            reflection: payload.reflection,
            tags: payload.tags,
            timeSpent: payload.timeSpent,
            sourceUrl: payload.sourceUrl ?? null,
            createdAt: now,
          },
        },
      },
      optimisticUpdater: (store) => {
        const record = store.create(optimisticId, "LearningLog");
        record.setValue(optimisticId, "id");
        record.setValue(payload.title, "title");
        record.setValue(payload.reflection, "reflection");
        record.setValue(payload.tags, "tags");
        record.setValue(payload.timeSpent, "timeSpent");
        record.setValue(payload.sourceUrl ?? null, "sourceUrl");
        record.setValue(now, "createdAt");
        insertIntoConnection(store, optimisticId);
      },
      updater: (store) => {
        const payloadRecord = store.getRootField("createLearningLog");
        const logRecord = payloadRecord?.getLinkedRecord("log");
        const root = store.get(ROOT_ID);
        if (!logRecord || !root) {
          return;
        }
        const connection = ConnectionHandler.getConnection(root, CONNECTION_KEY, connectionFilters);
        if (!connection) {
          return;
        }
        ConnectionHandler.deleteNode(connection, optimisticId);
        insertIntoConnection(store, logRecord.getDataID());
      },
      onCompleted: () => {
        resetCreateForm();
      },
      onError: (error) => {
        setCreateError(error.message);
      },
    });
  };

  const startEdit = (log: LearningLogShape) => {
    setEditForm({
      title: log.title,
      reflection: log.reflection,
      tags: log.tags.join(", "),
      timeSpent: String(log.timeSpent),
      sourceUrl: log.sourceUrl ?? "",
    });
    setEditingId(log.id);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(initialCreateState);
    setEditError(null);
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) {
      return;
    }
    setEditError(null);

    const tags = parseCsv(editForm.tags);
    const timeSpent = editForm.timeSpent ? Number(editForm.timeSpent) : undefined;

    let payload: LearningLogUpdateInput;
    try {
      payload = learningLogUpdateSchema.parse({
        id: editingId,
        title: editForm.title || undefined,
        reflection: editForm.reflection || undefined,
        tags: tags.length > 0 ? tags : undefined,
        timeSpent,
        sourceUrl: editForm.sourceUrl || undefined,
      });
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Invalid input");
      return;
    }

    commitUpdate({
      variables: {
        input: payload,
      },
      optimisticResponse: {
        updateLearningLog: {
          log: {
            id: payload.id,
            title: payload.title ?? undefined,
            reflection: payload.reflection ?? undefined,
            tags: payload.tags ?? undefined,
            timeSpent: payload.timeSpent ?? undefined,
            sourceUrl: Object.prototype.hasOwnProperty.call(payload, "sourceUrl")
              ? payload.sourceUrl ?? null
              : undefined,
            createdAt: undefined,
          },
        },
      },
      onCompleted: () => {
        cancelEdit();
      },
      onError: (error) => {
        setEditError(error.message);
      },
    });
  };

  const handleDelete = (logId: string) => {
    setDeleteError(null);
    commitDelete({
      variables: {
        input: { id: logId },
      },
      optimisticResponse: {
        deleteLearningLog: {
          deletedId: logId,
        },
      },
      optimisticUpdater: (store) => {
        const root = store.get(ROOT_ID);
        if (!root) {
          return;
        }
        const connection = ConnectionHandler.getConnection(root, CONNECTION_KEY, connectionFilters);
        if (connection) {
          ConnectionHandler.deleteNode(connection, logId);
        }
      },
      updater: (store) => {
        const root = store.get(ROOT_ID);
        if (!root) {
          return;
        }
        const connection = ConnectionHandler.getConnection(root, CONNECTION_KEY, connectionFilters);
        if (connection) {
          ConnectionHandler.deleteNode(connection, logId);
        }
      },
      onError: (error) => {
        setDeleteError(error.message);
      },
    });
  };

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextFilter = buildFilterInput(filterForm);
    setActiveFilter(nextFilter);
    refetch(
      {
        first: DEFAULT_PAGE_SIZE,
        after: null,
        filter: nextFilter ?? null,
      },
      { fetchPolicy: "network-only" },
    );
  };

  const resetFilters = () => {
    setFilterForm(initialFilterState);
    setActiveFilter(null);
    refetch(
      {
        first: DEFAULT_PAGE_SIZE,
        after: null,
        filter: null,
      },
      { fetchPolicy: "store-and-network" },
    );
  };

  return (
    <div className="min-h-screen bg-app py-12">
      <div className="container mx-auto flex flex-col gap-12">
        <header className="flex flex-col gap-3 text-center">
          <h1 className="text-4xl font-semibold text-slate-900">Learning Logs</h1>
          <p className="text-muted">
            Capture reflections, filter by tags or time, and keep track of how you invest your learning
            minutes.
          </p>
        </header>

        <section className="glass-panel rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900">Filter logs</h2>
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={applyFilters}>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="filter-q">
                Search
              </label>
              <input
                id="filter-q"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none"
                placeholder="Title or reflection"
                value={filterForm.q}
                onChange={(event) => setFilterForm((prev) => ({ ...prev, q: event.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="filter-tags-any">
                Tags (any)
              </label>
              <input
                id="filter-tags-any"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none"
                placeholder="react, ui"
                value={filterForm.tagsAny}
                onChange={(event) =>
                  setFilterForm((prev) => ({ ...prev, tagsAny: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="filter-tags-all">
                Tags (all)
              </label>
              <input
                id="filter-tags-all"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none"
                placeholder="testing, accessibility"
                value={filterForm.tagsAll}
                onChange={(event) =>
                  setFilterForm((prev) => ({ ...prev, tagsAll: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="filter-from">
                  From
                </label>
                <input
                  id="filter-from"
                  type="date"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none"
                  value={filterForm.from}
                  onChange={(event) =>
                    setFilterForm((prev) => ({ ...prev, from: event.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="filter-to">
                  To
                </label>
                <input
                  id="filter-to"
                  type="date"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none"
                  value={filterForm.to}
                  onChange={(event) => setFilterForm((prev) => ({ ...prev, to: event.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <button
                type="submit"
                className="rounded-full bg-primary-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
              >
                Apply filters
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-600"
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        <section className="glass-panel rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900">New log</h2>
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="create-title">
                Title
              </label>
              <input
                id="create-title"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none"
                placeholder="What did you learn?"
                value={createForm.title}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="create-reflection">
                Reflection
              </label>
              <textarea
                id="create-reflection"
                rows={4}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none"
                placeholder="Key takeaways, breakthroughs, or lingering questions"
                value={createForm.reflection}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, reflection: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="create-tags">
                Tags
              </label>
              <input
                id="create-tags"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none"
                placeholder="graphql, relay"
                value={createForm.tags}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, tags: event.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="create-time">
                Time spent (minutes)
              </label>
              <input
                id="create-time"
                type="number"
                min={0}
                max={1440}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none"
                value={createForm.timeSpent}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, timeSpent: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="create-source">
                Source URL
              </label>
              <input
                id="create-source"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none"
                placeholder="https://example.com/article"
                value={createForm.sourceUrl}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, sourceUrl: event.target.value }))
                }
              />
            </div>
            {createError ? (
              <p className="md:col-span-2 text-sm text-red-600">{createError}</p>
            ) : null}
            <div className="md:col-span-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={isCreateInFlight}
                className="rounded-full bg-primary-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
              >
                {isCreateInFlight ? "Saving…" : "Add log"}
              </button>
            </div>
          </form>
        </section>

        <section className="flex flex-col gap-4">
          {deleteError ? <p className="text-sm text-red-600">{deleteError}</p> : null}
          {logs.length === 0 ? (
            <div className="glass-panel rounded-xl p-10 text-center text-muted">
              No logs yet—capture your first insight.
            </div>
          ) : (
            <ul className="grid gap-4">
              {logs.map((logRef) => (
                <LearningLogItem
                  key={(logRef as { id: string }).id}
                  logRef={logRef}
                  editingId={editingId}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  onStartEdit={startEdit}
                  onSubmitEdit={handleUpdate}
                  onCancelEdit={cancelEdit}
                  editError={editError}
                  isUpdateInFlight={isUpdateInFlight}
                  onDelete={handleDelete}
                  isDeleteInFlight={isDeleteInFlight}
                />
              ))}
            </ul>
          )}
          {hasNext ? (
            <button
              type="button"
              onClick={() => loadNext(DEFAULT_PAGE_SIZE)}
              disabled={isLoadingNext}
              className="self-center rounded-full border border-primary-300 px-5 py-2 text-sm font-medium text-primary-600 transition hover:border-primary-400 hover:text-primary-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
            >
              {isLoadingNext ? "Loading…" : "Load more"}
            </button>
          ) : null}
        </section>
      </div>
    </div>
  );
}

type LearningLogItemProps = {
  logRef: learningLogFragments_learningLogItem$key;
  editingId: string | null;
  editForm: CreateFormState;
  setEditForm: Dispatch<SetStateAction<CreateFormState>>;
  onStartEdit: (log: LearningLogShape) => void;
  onSubmitEdit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  editError: MutationError;
  isUpdateInFlight: boolean;
  onDelete: (id: string) => void;
  isDeleteInFlight: boolean;
};

function LearningLogItem({
  logRef,
  editingId,
  editForm,
  setEditForm,
  onStartEdit,
  onSubmitEdit,
  onCancelEdit,
  editError,
  isUpdateInFlight,
  onDelete,
  isDeleteInFlight,
}: LearningLogItemProps) {
  const log = useFragment(learningLogItemFragment, logRef) as LearningLogShape | null;

  if (!log) {
    return null;
  }

  const isEditing = editingId === log.id;

  const renderTags = () => (
    <div className="mt-3 flex flex-wrap gap-2">
      <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
        {log.timeSpent} min
      </span>
      {log.tags.map((tag) => (
        <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
          #{tag}
        </span>
      ))}
    </div>
  );

  if (isEditing) {
    return (
      <li className="glass-panel rounded-xl p-6">
        <form className="grid gap-4" onSubmit={onSubmitEdit}>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700" htmlFor={`edit-title-${log.id}`}>
              Title
            </label>
            <input
              id={`edit-title-${log.id}`}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none"
              value={editForm.title}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor={`edit-reflection-${log.id}`}
            >
              Reflection
            </label>
            <textarea
              id={`edit-reflection-${log.id}`}
              rows={4}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none"
              value={editForm.reflection}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, reflection: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor={`edit-tags-${log.id}`}>
                Tags
              </label>
              <input
                id={`edit-tags-${log.id}`}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none"
                value={editForm.tags}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, tags: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor={`edit-time-${log.id}`}>
                Time spent
              </label>
              <input
                id={`edit-time-${log.id}`}
                type="number"
                min={0}
                max={1440}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none"
                value={editForm.timeSpent}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, timeSpent: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor={`edit-source-${log.id}`}>
                Source URL
              </label>
              <input
                id={`edit-source-${log.id}`}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none"
                value={editForm.sourceUrl}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, sourceUrl: event.target.value }))
                }
              />
            </div>
          </div>
          {editError ? <p className="text-sm text-red-600">{editError}</p> : null}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isUpdateInFlight}
              className="rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
            >
              {isUpdateInFlight ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="glass-panel rounded-xl p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{log.title}</h3>
            <p className="text-xs text-muted">{formatDate(log.createdAt)}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onStartEdit(log)}
              className="rounded-full border border-slate-300 px-4 py-1 text-xs font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-600"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={isDeleteInFlight}
              onClick={() => onDelete(log.id)}
              className="rounded-full border border-red-200 px-4 py-1 text-xs font-medium text-red-500 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
            >
              Delete
            </button>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-700">{log.reflection}</p>
        {renderTags()}
        {log.sourceUrl ? (
          <a
            href={log.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Source ↗
          </a>
        ) : null}
      </div>
    </li>
  );
}
