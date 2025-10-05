"use client";

// ...existing code...
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "react-relay";
import type { PayloadError } from "relay-runtime";

import { createLearningLogMutation } from "@/relay/mutations/createLearningLogMutation";
import { learningLogCreateSchema, mapZodIssuesToFieldErrors } from "@/lib/validation";

const FIELD_KEYS = ["title", "reflection", "tags", "timeSpent", "sourceUrl"] as const;
type FieldKey = (typeof FIELD_KEYS)[number];
type FieldErrors = Partial<Record<FieldKey, string>>;

type QuickAddFormState = {
  title: string;
  reflection: string;
  tags: string;
  timeSpent: string;
  sourceUrl: string;
};

const initialFormState: QuickAddFormState = {
  title: "",
  reflection: "",
  tags: "",
  timeSpent: "30",
  sourceUrl: "",
};

const parseCsv = (value: string): string[] =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

const extractValidationFields = (errors?: readonly PayloadError[] | null) => {
  if (!errors || errors.length === 0) {
    return null;
  }
  const validationError = errors.find((error) => error?.message === "VALIDATION_ERROR");
  if (!validationError) {
    return null;
  }
  // Extensions is not typed, so use type assertion
  const extensions = (validationError as { extensions?: { fields?: Record<string, string> } }).extensions;
  return extensions?.fields ?? null;
};
// Type for mutation response
type CreateLearningLogMutationResponse = {
  createLearningLog?: {
    log?: {
      id: string;
      title: string;
      reflection: string;
      tags: string[];
      timeSpent: number;
      sourceUrl?: string | null;
      createdAt: string;
    };
  };
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

const MAX_TITLE_LEN = 100;
const MAX_REFLECTION_LEN = 1000;
const MAX_TAGS = 8;
const URL_REGEX = /^https?:\/\/[\w.-]+(?:\.[\w\.-]+)+(?:[\w\-\._~:/?#[\]@!$&'()*+,;=.]+)?$/i;

const buildCreateCandidate = (state: QuickAddFormState): {
  title: string;
  reflection: string;
  tags: string[];
  timeSpent: number;
  sourceUrl?: string;
} => {
  const tags = parseCsv(state.tags).slice(0, MAX_TAGS);
  const title = state.title.trim().slice(0, MAX_TITLE_LEN);
  const reflection = state.reflection.trim().slice(0, MAX_REFLECTION_LEN);
  const timeInput = state.timeSpent.trim();
  // Coerce minutes safely
  const minutes = Math.max(1, Math.min(1440, Number.parseInt(timeInput, 10) || 0));
  let sourceUrl: string | undefined = state.sourceUrl.trim();
  if (sourceUrl === "") sourceUrl = undefined;
  else if (sourceUrl && !URL_REGEX.test(sourceUrl)) sourceUrl = sourceUrl; // will be flagged as error below

  return {
    title,
    reflection,
    tags,
    timeSpent: minutes,
    sourceUrl,
  };
};

const createTempId = () => `client:quick-add:${Date.now()}`;

export default function QuickAddCard() {
  const [commitCreate, isInFlight] = useMutation(createLearningLogMutation);
  const [form, setForm] = useState<QuickAddFormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [lastSavedTitle, setLastSavedTitle] = useState<string>("");
  const titleRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!isInFlight) {
      const frame = requestAnimationFrame(() => {
        titleRef.current?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [isInFlight]);

  const handleChange = (key: FieldKey) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  // Inline client-side URL validation
  const urlError = useMemo(() => {
    const url = form.sourceUrl.trim();
    if (url && !URL_REGEX.test(url)) {
      return "Enter a valid URL (https://...)";
    }
    return undefined;
  }, [form.sourceUrl]);

  const createValidation = useMemo(
    () => learningLogCreateSchema.safeParse(buildCreateCandidate(form)),
    [form],
  );

  const derivedFieldErrors = useMemo(() => {
    const errors: FieldErrors = {};
    if (!createValidation.success) {
      Object.assign(errors, mergeFieldErrors(mapZodIssuesToFieldErrors(createValidation.error.issues)));
    }
    if (urlError) {
      errors.sourceUrl = urlError;
    }
    return errors;
  }, [createValidation, urlError]);

  const visibleFieldErrors = useMemo(
    () => ({
      ...derivedFieldErrors,
      ...fieldErrors,
    }),
    [derivedFieldErrors, fieldErrors],
  );

  const isSubmitDisabled = isInFlight || !createValidation.success;

  const applyFieldErrors = (fields: Record<string, string>) => {
    setFieldErrors((prev) => ({ ...prev, ...mergeFieldErrors(fields) }));
    setSubmitError("Please fix the highlighted fields.");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const validation = learningLogCreateSchema.safeParse(buildCreateCandidate(form));

    if (!validation.success) {
      const fields = mapZodIssuesToFieldErrors(validation.error.issues);
      applyFieldErrors(fields);
      return;
    }

    const payload = validation.data;
    const optimisticId = createTempId();
    const now = new Date().toISOString();

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
      onCompleted: (response: unknown, errors: readonly PayloadError[] | null) => {
        const validationFields = extractValidationFields(errors);
        if (validationFields) {
          applyFieldErrors(validationFields);
          return;
        }

        setFieldErrors({});
        setStatus("success");
        const resp = response as CreateLearningLogMutationResponse;
        const logTitle = resp.createLearningLog?.log?.title ?? payload.title;
        setLastSavedTitle(logTitle);
        setForm(initialFormState);
        // Optimistically update RecentLogs
        if (resp.createLearningLog?.log) {
          // Only send required fields for RecentLog
          const { id, title, reflection, tags, createdAt } = resp.createLearningLog.log;
          window.dispatchEvent(
            new CustomEvent('learnlog:created', {
              detail: { id, title, reflection, tags, createdAt }
            })
          );
        }
        // Show toast and refocus Title
        setToast("Saved!");
        if (titleRef.current) {
          titleRef.current.focus();
        }
        setTimeout(() => setToast(null), 2000);
      },
      onError: (error) => {
        setSubmitError(error.message);
      },
    });
  };

  const resetForm = () => {
    setStatus("idle");
    setSubmitError(null);
    setFieldErrors({});
    setForm(initialFormState);
    requestAnimationFrame(() => {
      titleRef.current?.focus();
    });
  };

  return (
    <>
      <section className="glass-panel mx-auto max-w-2xl rounded-xl p-8">
        <h2 className="text-2xl font-semibold text-black">Quick Add</h2>
        <p className="mt-2 text-sm text-muted">
        </p>

        {status === "success" ? (
          <div className="mt-6 flex flex-col gap-4">
            <div className="rounded-lg border border-primary-200 bg-white/80 p-4 text-sm text-black">
              <p>
                <span className="font-medium text-primary-700">Success!</span> Your log
                {lastSavedTitle ? ` “${lastSavedTitle}”` : ""} was saved.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-primary-300 px-5 py-2 text-sm font-medium text-primary-600 transition hover:border-primary-400 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Add another
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-black" htmlFor="quick-title">
                Title
              </label>
              <input
                id="quick-title"
                ref={titleRef}
                disabled={isInFlight}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                value={form.title}
                onChange={handleChange("title")}
                placeholder="What did you learn?"
              />
              {visibleFieldErrors.title ? <p className="text-xs text-red-600">{visibleFieldErrors.title}</p> : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-black" htmlFor="quick-reflection">
                Reflection
              </label>
              <textarea
                id="quick-reflection"
                disabled={isInFlight}
                rows={4}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                value={form.reflection}
                onChange={handleChange("reflection")}
                placeholder="Key takeaways, insights, or notes"
              />
              {visibleFieldErrors.reflection ? (
                <p className="text-xs text-red-600">{visibleFieldErrors.reflection}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-black" htmlFor="quick-tags">
                  Tags
                </label>
                <input
                  id="quick-tags"
                  disabled={isInFlight}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                  value={form.tags}
                  onChange={handleChange("tags")}
                  placeholder="react, ui"
                />
                {visibleFieldErrors.tags ? <p className="text-xs text-red-600">{visibleFieldErrors.tags}</p> : null}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-black" htmlFor="quick-time">
                  Time spent (minutes)
                </label>
                <input
                  id="quick-time"
                  type="number"
                  min={1}
                  max={1440}
                  disabled={isInFlight}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                  value={form.timeSpent}
                  onChange={handleChange("timeSpent")}
                />
                {visibleFieldErrors.timeSpent ? (
                  <p className="text-xs text-red-600">{visibleFieldErrors.timeSpent}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-black" htmlFor="quick-source">
                  Source URL
                </label>
                <input
                  id="quick-source"
                  disabled={isInFlight}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-primary-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                  value={form.sourceUrl}
                  onChange={handleChange("sourceUrl")}
                  placeholder="https://"
                />
                {visibleFieldErrors.sourceUrl ? (
                  <p className="text-xs text-red-600">{visibleFieldErrors.sourceUrl}</p>
                ) : null}
              </div>
            </div>

            {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

            <div className="flex justify-end">
              <button
                type="submit"
                data-testid="quickadd-submit"
                disabled={isSubmitDisabled}
                aria-busy={isInFlight}
                className="rounded-full bg-primary-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
              >
                {isInFlight ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </section>
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-lg bg-primary-700 px-4 py-2 text-sm text-white shadow-lg animate-fadein"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </>
  );
}
