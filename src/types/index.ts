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

// Teacher Assignment Schema
export const teacherAssignmentSchema = z.object({
  id: z.string(),
  subject: z.string().min(1, 'Subject is required'),
  teacher: z.string().min(1, 'Teacher name is required'),
  category: z.enum(['core', 'professional']),
});

export type TeacherAssignment = z.infer<typeof teacherAssignmentSchema>;

// Grade Schema
export const gradeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Grade name is required'),
  description: z.string().optional(),
  colorIndex: z.number().min(0).max(5).default(0),
  order: z.number().default(0),
  classroomTeacher: z.string().optional(),
  teacherAssignments: z.array(teacherAssignmentSchema).optional(),
});

export type Grade = z.infer<typeof gradeSchema>;

// Assessment Point Schema
export const assessmentPointSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Assessment point name is required'),
  description: z.string().optional(),
  maxStars: z.number().min(1).max(5).default(3),
});

export type AssessmentPoint = z.infer<typeof assessmentPointSchema>;

// Subject Schema (grouping of assessment points)
export const subjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Subject name is required'),
  description: z.string().optional(),
  assessmentPoints: z.array(assessmentPointSchema),
});

export type Subject = z.infer<typeof subjectSchema>;

// Assessment Template Schema (full report structure)
export const assessmentTemplateSchema = z.object({
  id: z.string(),
  gradeId: z.string(),
  name: z.string().min(1, 'Assessment name is required'),
  description: z.string().optional(),
  subjects: z.array(subjectSchema),
  schoolYearId: z.string(),
  createdAt: z.string().optional(),
});

export type AssessmentTemplate = z.infer<typeof assessmentTemplateSchema>;

// Student Schema
export const studentSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  nameUsed: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gradeId: z.string(),
  schoolYearId: z.string(),
  avatarUrl: z.string().optional(),
});

export type Student = z.infer<typeof studentSchema>;

// Report Entry (filled assessment for one point)
export const reportEntrySchema = z.object({
  assessmentPointId: z.string(),
  subjectId: z.string(),
  stars: z.number().min(0).max(5),
  teacherNotes: z.string().optional(),
  aiRewrittenText: z.string().optional(),
});

export type ReportEntry = z.infer<typeof reportEntrySchema>;

// Subject Comment (teacher comment per subject)
export const subjectCommentSchema = z.object({
  subjectId: z.string(),
  teacherComment: z.string().optional(),
  aiRewrittenComment: z.string().optional(),
  attitudeTowardsLearning: z.enum(['Emerging', 'Developing', 'Applying', 'Independent']).optional(),
});

export type SubjectComment = z.infer<typeof subjectCommentSchema>;

// Student Report Schema
export const studentReportSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  assessmentTemplateId: z.string(),
  schoolYearId: z.string(),
  term: z.string().default('Term 1 & 2'),
  reportTitle: z.string().optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  entries: z.array(reportEntrySchema),
  subjectComments: z.array(subjectCommentSchema).optional(),
  generalComment: z.string().optional(),
  status: z.enum(['draft', 'completed', 'reviewed']).default('draft'),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type StudentReport = z.infer<typeof studentReportSchema>;

// App Settings Schema
export const appSettingsSchema = z.object({
  schoolName: z.string().default(''),
  missionStatement: z.string().default(''),
  statement: z.string().default(''),
  vision: z.string().default(''),
  values: z.array(z.string()).default([]),
  gradingKey: z.string().default(''),
  companyWritingStyle: z.string().default(''),
});

export type AppSettings = z.infer<typeof appSettingsSchema>;
