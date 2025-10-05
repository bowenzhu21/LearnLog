import { z, type ZodIssue } from "zod";

const titleSchema = z.string().trim().min(1, "Title is required").max(120, "Keep it concise");
const reflectionSchema = z
  .string()
  .trim()
  .min(1, "Reflection is required")
  .max(2000, "Reflection is too long");
const tagSchema = z.string().trim().min(1, "Tag cannot be empty").max(24, "Tag is too long");
const tagsSchema = z
  .array(tagSchema)
  .min(1, "Add at least one tag")
  .max(20, "Limit to 20 tags");
const timeSpentSchema = z
  .number({ invalid_type_error: "Time spent must be a number" })
  .int("Time spent must be an integer")
  .min(1, "Time spent must be at least 1 minute")
  .max(1440, "Keep it under 24 hours");

const sourceUrlSchema = z
  .union([
    z.string().trim().url("Provide a valid URL"),
    z.literal("").transform(() => undefined),
  ])
  .optional()
  .or(z.null().transform(() => undefined))
  .transform((value) => (value === null || value === undefined ? undefined : value));

export const learningLogCreateSchema = z.object({
  title: titleSchema,
  reflection: reflectionSchema,
  tags: tagsSchema,
  timeSpent: timeSpentSchema,
  sourceUrl: sourceUrlSchema,
});

export const learningLogUpdateSchema = learningLogCreateSchema
  .partial()
  .extend({
    id: z.string().trim().min(1, "Log ID required"),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.reflection !== undefined ||
      value.tags !== undefined ||
      value.timeSpent !== undefined ||
      value.sourceUrl !== undefined,
    {
      message: "Provide at least one field to update",
      path: ["id"],
    },
  );

export type LearningLogCreateInput = z.infer<typeof learningLogCreateSchema>;
export type LearningLogUpdateInput = z.infer<typeof learningLogUpdateSchema>;
export type LearningLogFieldErrors = Record<string, string>;

export const mapZodIssuesToFieldErrors = (issues: ZodIssue[]): LearningLogFieldErrors =>
  issues.reduce<LearningLogFieldErrors>((acc, issue) => {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in acc)) {
      acc[key] = issue.message;
    }
    return acc;
  }, {});
