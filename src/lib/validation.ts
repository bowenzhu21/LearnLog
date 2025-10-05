import { z } from "zod";

const titleSchema = z.string().trim().min(1, "Title is required").max(120, "Keep it concise");
const reflectionSchema = z
  .string()
  .trim()
  .min(1, "Reflection is required")
  .max(4000, "Reflection is too long");
const tagsSchema = z
  .array(z.string().trim().min(1, "Tag cannot be empty"))
  .min(1, "Add at least one tag")
  .max(12, "Limit to 12 tags");
const timeSpentSchema = z
  .number({ invalid_type_error: "Time spent must be a number" })
  .int("Time spent must be an integer")
  .nonnegative("Time spent cannot be negative")
  .max(1440, "Keep it under 24 hours");

const optionalUrl = z
  .string()
  .trim()
  .url("Provide a valid URL")
  .max(2048, "URL is too long");

const sourceUrlSchema = optionalUrl
  .optional()
  .or(z.literal("").transform(() => undefined))
  .or(z.null().transform(() => undefined));

export const learningLogCreateSchema = z.object({
  title: titleSchema,
  reflection: reflectionSchema,
  tags: tagsSchema,
  timeSpent: timeSpentSchema,
  sourceUrl: sourceUrlSchema,
});

export const learningLogUpdateSchema = z
  .object({
    id: z.string().min(1, "Log ID required"),
    title: titleSchema.optional(),
    reflection: reflectionSchema.optional(),
    tags: tagsSchema.optional(),
    timeSpent: timeSpentSchema.optional(),
    sourceUrl: sourceUrlSchema,
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
      path: ["title"],
    },
  );

export type LearningLogCreateInput = z.infer<typeof learningLogCreateSchema>;
export type LearningLogUpdateInput = z.infer<typeof learningLogUpdateSchema>;
