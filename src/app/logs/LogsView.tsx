"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  ConnectionHandler,
  ROOT_ID,
  graphql,
  useLazyLoadQuery,
  useMutation,
  usePaginationFragment,
  useFragment,
  type PayloadError,
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
  mapZodIssuesToFieldErrors,
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

const FIELD_KEYS = ["title", "reflection", "tags", "timeSpent", "sourceUrl"] as const;
type FormField = (typeof FIELD_KEYS)[number];
type FieldErrors = Partial<Record<FormField, string>>;
const extractValidationFields = (errors?: readonly PayloadError[] | null) => {
  if (!errors || errors.length === 0) {
    return null;
  }
  const validationError = errors.find((error) => error?.message === "VALIDATION_ERROR");
  if (!validationError) {
    return null;
  }
  return (validationError.extensions?.fields ?? null) as Record<string, string> | null;
};

const mergeFieldErrors = (fields: Record<string, string>): FieldErrors => {
  const next: FieldErrors = {};
  for (const key of FIELD_KEYS) {
    if (key in fields) {
      next[key] = fields[key];
    }
  }
  return next;
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

const buildCreateCandidate = (state: CreateFormState) => {
  const title = state.title.trim();
  const reflection = state.reflection.trim();
  const tags = Array.from(new Set(parseCsv(state.tags))).sort();
  const timeInput = state.timeSpent.trim();
  const sourceUrl = state.sourceUrl.trim();

  return {
    title,
    reflection,
    tags,
    timeSpent: timeInput === "" ? Number.NaN : Number(timeInput),
    sourceUrl: sourceUrl === "" ? undefined : sourceUrl,
  };
};

const buildUpdateCandidate = (
  id: string,
  state: CreateFormState,
  original: LearningLogShape | null,
): Record<string, unknown> | null => {
  const title = state.title.trim();
  const reflection = state.reflection.trim();
  const tags = Array.from(new Set(parseCsv(state.tags))).sort();
  const timeInput = state.timeSpent.trim();
  const timeSpent = timeInput === "" ? Number.NaN : Number(timeInput);
  const sourceUrlRaw = state.sourceUrl.trim();

  const next: Record<string, unknown> = { id };

  if (title && title !== original?.title) {
    next.title = title;
  }

  if (reflection && reflection !== original?.reflection) {
    next.reflection = reflection;
  }

  if (tags.length > 0) {
    const originalTags = Array.from(new Set(original?.tags ?? [])).sort();
    const tagsChanged =
      tags.length !== originalTags.length ||
      tags.some((tag, index) => tag !== originalTags[index]);

    if (tagsChanged) {
      next.tags = tags;
    }
  }

  if (Number.isFinite(timeSpent) && timeSpent > 0 && timeSpent !== original?.timeSpent) {
    next.timeSpent = timeSpent;
  }

  const normalizedSourceUrl = sourceUrlRaw === "" ? undefined : sourceUrlRaw;
  const originalSourceUrl = original?.sourceUrl ?? undefined;
  if (normalizedSourceUrl !== originalSourceUrl) {
    next.sourceUrl = normalizedSourceUrl ?? null;
  }

  return Object.keys(next).length > 1 ? next : null;
};

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
  const [createErrors, setCreateErrors] = useState<FieldErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CreateFormState>(initialCreateState);
  const [editError, setEditError] = useState<MutationError>(null);
  const [editErrors, setEditErrors] = useState<FieldErrors>({});
  const [editingOriginal, setEditingOriginal] = useState<LearningLogShape | null>(null);
  const [deleteError, setDeleteError] = useState<MutationError>(null);
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

  const createTitleRef = useRef<HTMLInputElement>(null);

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
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      createTitleRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const createValidation = useMemo(
    () => learningLogCreateSchema.safeParse(buildCreateCandidate(createForm)),
    [createForm],
  );
  const isCreateFormValid = createValidation.success;

  const derivedCreateErrors = useMemo(() => {
    if (createValidation.success) {
      return {} as FieldErrors;
    }
    return mergeFieldErrors(mapZodIssuesToFieldErrors(createValidation.error.issues));
  }, [createValidation]);

  const visibleCreateErrors = useMemo(
    () => ({
      ...derivedCreateErrors,
      ...createErrors,
    }),
    [derivedCreateErrors, createErrors],
  );

  const editCandidate = useMemo(() => {
    if (!editingId) {
      return null;
    }
    return buildUpdateCandidate(editingId, editForm, editingOriginal);
  }, [editingId, editForm, editingOriginal]);

  const editValidation = useMemo(() => {
    if (!editCandidate) {
      return null;
    }
    return learningLogUpdateSchema.safeParse(editCandidate);
  }, [editCandidate]);

  const derivedEditErrors = useMemo(() => {
    if (!editValidation || editValidation.success) {
      return {} as FieldErrors;
    }
    return mergeFieldErrors(mapZodIssuesToFieldErrors(editValidation.error.issues));
  }, [editValidation]);

  const visibleEditErrors = useMemo(
    () => ({
      ...derivedEditErrors,
      ...editErrors,
    }),
    [derivedEditErrors, editErrors],
  );

  const resetCreateForm = () => {
    setCreateForm(initialCreateState);
    setCreateError(null);
    setCreateErrors({});
    requestAnimationFrame(() => {
      createTitleRef.current?.focus();
    });
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);

    const validation = learningLogCreateSchema.safeParse(buildCreateCandidate(createForm));

    if (!validation.success) {
      setCreateErrors((prev) => ({
        ...prev,
        ...mergeFieldErrors(mapZodIssuesToFieldErrors(validation.error.issues)),
      }));
      setCreateError("Please fix the highlighted fields.");
      return;
    }

    const payload = validation.data;
    const optimisticId = createTempId();
    const now = new Date().toISOString();

    setCreateErrors({});
    setPendingScrollId(optimisticId);

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
      onCompleted: (response, errors) => {
        const validationFields = extractValidationFields(errors);
        if (validationFields) {
          setCreateErrors((prev) => ({
            ...prev,
            ...mergeFieldErrors(validationFields),
          }));
          setCreateError("Please fix the highlighted fields.");
          setPendingScrollId(null);
          return;
        }

        const newId = response?.createLearningLog?.log?.id ?? optimisticId;
        setPendingScrollId(newId);
        resetCreateForm();
      },
      onError: (error) => {
        setPendingScrollId(null);
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
    setEditingOriginal(log);
    setEditError(null);
    setEditErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingOriginal(null);
    setEditForm(initialCreateState);
    setEditError(null);
    setEditErrors({});
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) {
      return;
    }
    if (!editCandidate) {
      setEditError("Nothing changed to update.");
      return;
    }
    setEditError(null);
    setEditErrors({});

    const validation = editValidation ?? learningLogUpdateSchema.safeParse(editCandidate);

    if (!validation || !validation.success) {
      const issues = validation?.error?.issues ?? [];
      setEditErrors((prev) => ({
        ...prev,
        ...mergeFieldErrors(mapZodIssuesToFieldErrors(issues)),
      }));
      setEditError("Please fix the highlighted fields.");
      return;
    }

    const payload = validation.data;
    const input: LearningLogUpdateInput = { id: payload.id };
    const optimisticData: Partial<LearningLogShape> & { id: string } = {
      id: payload.id,
    };

    if (payload.title !== undefined) {
      input.title = payload.title;
      optimisticData.title = payload.title;
    }
    if (payload.reflection !== undefined) {
      input.reflection = payload.reflection;
      optimisticData.reflection = payload.reflection;
    }
    if (payload.tags !== undefined) {
      input.tags = payload.tags;
      optimisticData.tags = payload.tags;
    }
    if (payload.timeSpent !== undefined) {
      input.timeSpent = payload.timeSpent;
      optimisticData.timeSpent = payload.timeSpent;
    }
    const hasSourceUrl = Object.prototype.hasOwnProperty.call(payload, "sourceUrl");
    if (hasSourceUrl) {
      input.sourceUrl = payload.sourceUrl ?? null;
      optimisticData.sourceUrl = payload.sourceUrl ?? null;
    }

    commitUpdate({
      variables: {
        input,
      },
      optimisticResponse: {
        updateLearningLog: {
          log: optimisticData,
        },
      },
      onCompleted: (_response, errors) => {
        const validationFields = extractValidationFields(errors);
        if (validationFields) {
          setEditErrors((prev) => ({
            ...prev,
            ...mergeFieldErrors(validationFields),
          }));
          setEditError("Please fix the highlighted fields.");
          return;
        }
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

  const handleCreateChange = (key: FormField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setCreateForm((prev) => ({ ...prev, [key]: value }));
    if (createErrors[key]) {
      setCreateErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleEditChange = (key: FormField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setEditForm((prev) => ({ ...prev, [key]: value }));
    if (editErrors[key]) {
      setEditErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  useEffect(() => {
    if (!pendingScrollId) {
      return;
    }
    let frame: number;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    const scrollToTarget = () => {
      frame = requestAnimationFrame(() => {
        const node = document.getElementById(`log-${pendingScrollId}`);
        if (node) {
          node.scrollIntoView({ behavior: "smooth", block: "start" });
          node.classList.add("ring-2", "ring-primary-300", "ring-offset-2", "ring-offset-white");
          timeout = setTimeout(() => {
            node.classList.remove("ring-2", "ring-primary-300", "ring-offset-2", "ring-offset-white");
          }, 1500);
          setPendingScrollId(null);
        } else if (attempts < 6) {
          attempts += 1;
          scrollToTarget();
        } else {
          setPendingScrollId(null);
        }
      });
    };

    scrollToTarget();

    return () => {
      cancelAnimationFrame(frame);
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [pendingScrollId]);

  const renderCreateForm = (variant: "card" | "inline" = "card") => (
    <form
      className={`${variant === "card" ? "mt-4" : "mt-6"} grid gap-4 md:grid-cols-2`}
      onSubmit={handleCreate}
      noValidate
    >
      <div className="flex flex-col gap-2 md:col-span-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="create-title">
          Title
        </label>
        <input
          id="create-title"
          ref={createTitleRef}
          disabled={isCreateInFlight}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="What did you learn?"
          value={createForm.title}
          onChange={handleCreateChange("title")}
        />
        {visibleCreateErrors.title ? <p className="text-xs text-red-600">{visibleCreateErrors.title}</p> : null}
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="create-reflection">
          Reflection
        </label>
        <textarea
          id="create-reflection"
          disabled={isCreateInFlight}
          rows={4}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          value={createForm.reflection}
          onChange={handleCreateChange("reflection")}
          placeholder="Key takeaways, insights, or notes"
        />
        {visibleCreateErrors.reflection ? <p className="text-xs text-red-600">{visibleCreateErrors.reflection}</p> : null}
      </div>

      <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="create-tags">
            Tags (CSV)
          </label>
          <input
            id="create-tags"
            disabled={isCreateInFlight}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
            value={createForm.tags}
            onChange={handleCreateChange("tags")}
            placeholder="react, ui"
          />
          {visibleCreateErrors.tags ? <p className="text-xs text-red-600">{visibleCreateErrors.tags}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="create-time">
            Time spent (minutes)
          </label>
          <input
            id="create-time"
            type="number"
            min={1}
            max={1440}
            disabled={isCreateInFlight}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
            value={createForm.timeSpent}
            onChange={handleCreateChange("timeSpent")}
          />
          {visibleCreateErrors.timeSpent ? <p className="text-xs text-red-600">{visibleCreateErrors.timeSpent}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="create-source">
            Source URL
          </label>
          <input
            id="create-source"
            disabled={isCreateInFlight}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
            value={createForm.sourceUrl}
            onChange={handleCreateChange("sourceUrl")}
            placeholder="https://"
          />
          {visibleCreateErrors.sourceUrl ? <p className="text-xs text-red-600">{visibleCreateErrors.sourceUrl}</p> : null}
        </div>
      </div>

      {createError ? (
        <p className="md:col-span-2 text-sm text-red-600">{createError}</p>
      ) : null}

      <div className="md:col-span-2 flex justify-end">
        <button
          type="submit"
          disabled={isCreateInFlight || !isCreateFormValid}
          className="rounded-full bg-primary-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
        >
          {isCreateInFlight ? "Saving…" : "Add log"}
        </button>
      </div>
    </form>
  );

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
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
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
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
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
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
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

        {logs.length > 0 ? (
          <section className="glass-panel rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-900">New log</h2>
            {renderCreateForm()}
          </section>
        ) : null}

        <section className="flex flex-col gap-4">
          {deleteError ? <p className="text-sm text-red-600">{deleteError}</p> : null}
          {logs.length === 0 ? (
            <div className="glass-panel rounded-xl p-10 text-left">
              <h2 className="text-xl font-semibold text-slate-900">Start your first log</h2>
              <p className="mt-2 text-sm text-muted">
                Capture a reflection below and we'll keep it safe for future you.
              </p>
              {renderCreateForm("inline")}
            </div>
          ) : (
            <>
              <ul className="grid gap-4">
                {logs.map((logRef) => (
                  <LearningLogItem
                    key={(logRef as { id: string }).id}
                    logRef={logRef}
                    editingId={editingId}
                    editForm={editForm}
                    editErrors={visibleEditErrors}
                    onEditChange={handleEditChange}
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
            </>
          )}
        </section>
      </div>
    </div>
  );
}

type LearningLogItemProps = {
  logRef: learningLogFragments_learningLogItem$key;
  editingId: string | null;
  editForm: CreateFormState;
  editErrors: FieldErrors;
  onEditChange: (key: FormField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
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
  editErrors,
  onEditChange,
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

  const updateValidation = useMemo(() => {
    if (!isEditing) {
      return null;
    }
    return learningLogUpdateSchema.safeParse(buildUpdateCandidate(log.id, editForm));
  }, [isEditing, log.id, editForm]);

  const isSaveDisabled = isUpdateInFlight || !(updateValidation?.success ?? false);

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
      <li id={`log-${log.id}`} className="glass-panel rounded-xl p-6">
        <form className="grid gap-4" onSubmit={onSubmitEdit} noValidate>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700" htmlFor={`edit-title-${log.id}`}>
              Title
            </label>
            <input
              id={`edit-title-${log.id}`}
              disabled={isUpdateInFlight}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
              value={editForm.title}
              onChange={onEditChange("title")}
            />
            {editErrors.title ? <p className="text-xs text-red-600">{editErrors.title}</p> : null}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700" htmlFor={`edit-reflection-${log.id}`}>
              Reflection
            </label>
            <textarea
              id={`edit-reflection-${log.id}`}
              rows={4}
              disabled={isUpdateInFlight}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
              value={editForm.reflection}
              onChange={onEditChange("reflection")}
              placeholder="Key takeaways, insights, or notes"
            />
            {editErrors.reflection ? <p className="text-xs text-red-600">{editErrors.reflection}</p> : null}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor={`edit-tags-${log.id}`}>
                Tags
              </label>
              <input
                id={`edit-tags-${log.id}`}
                disabled={isUpdateInFlight}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                value={editForm.tags}
                onChange={onEditChange("tags")}
              />
              {editErrors.tags ? <p className="text-xs text-red-600">{editErrors.tags}</p> : null}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor={`edit-time-${log.id}`}>
                Time spent
              </label>
              <input
                id={`edit-time-${log.id}`}
                type="number"
                min={1}
                max={1440}
                disabled={isUpdateInFlight}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                value={editForm.timeSpent}
                onChange={onEditChange("timeSpent")}
              />
              {editErrors.timeSpent ? <p className="text-xs text-red-600">{editErrors.timeSpent}</p> : null}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor={`edit-source-${log.id}`}>
                Source URL
              </label>
              <input
                id={`edit-source-${log.id}`}
                disabled={isUpdateInFlight}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                value={editForm.sourceUrl}
                onChange={onEditChange("sourceUrl")}
              />
              {editErrors.sourceUrl ? <p className="text-xs text-red-600">{editErrors.sourceUrl}</p> : null}
            </div>
          </div>
          {editError ? <p className="text-sm text-red-600">{editError}</p> : null}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaveDisabled}
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
    <li id={`log-${log.id}`} className="glass-panel rounded-xl p-6">
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
