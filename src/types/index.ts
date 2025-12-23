import { z } from 'zod';

// School Year Schema
export const schoolYearSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'School year name is required'),
  startYear: z.number(),
  endYear: z.number(),
  isActive: z.boolean().default(false),
});

export type SchoolYear = z.infer<typeof schoolYearSchema>;

// Grade Schema
export const gradeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Grade name is required'),
  description: z.string().optional(),
  colorIndex: z.number().min(0).max(5).default(0),
  order: z.number().default(0),
});

export type Grade = z.infer<typeof gradeSchema>;

// Subject/Assessment Template Schema
export const assessmentPointSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Assessment point label is required'),
  description: z.string().optional(),
  maxStars: z.number().min(1).max(5).default(4),
  order: z.number().default(0),
});

export type AssessmentPoint = z.infer<typeof assessmentPointSchema>;

export const assessmentTemplateSchema = z.object({
  id: z.string(),
  gradeId: z.string(),
  name: z.string().min(1, 'Assessment name is required'),
  description: z.string().optional(),
  points: z.array(assessmentPointSchema),
  schoolYearId: z.string(),
  createdAt: z.string(),
});

export type AssessmentTemplate = z.infer<typeof assessmentTemplateSchema>;

// Student Schema
export const studentSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  gradeId: z.string(),
  schoolYearId: z.string(),
  avatarUrl: z.string().optional(),
});

export type Student = z.infer<typeof studentSchema>;

// Report Entry (filled assessment)
export const reportEntrySchema = z.object({
  assessmentPointId: z.string(),
  stars: z.number().min(0).max(5),
  teacherNotes: z.string().optional(),
  aiRewrittenText: z.string().optional(),
});

export type ReportEntry = z.infer<typeof reportEntrySchema>;

export const studentReportSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  assessmentTemplateId: z.string(),
  schoolYearId: z.string(),
  term: z.number().min(1).max(4),
  entries: z.array(reportEntrySchema),
  status: z.enum(['draft', 'completed', 'reviewed']).default('draft'),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type StudentReport = z.infer<typeof studentReportSchema>;
