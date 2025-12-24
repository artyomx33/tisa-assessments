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
  isNA: z.boolean().optional(),
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

// Exam Result Schema (for Tests & Exams table)
export const examResultSchema = z.object({
  id: z.string(),
  term: z.string(),              // "Term 1", "Term 2"
  date: z.string(),              // "10/2025" format
  title: z.string(),             // "Assessment of term skills"
  subject: z.string(),           // "English", "Math", etc.
  grade: z.number().min(0).max(3), // 0-3 stars
  isNA: z.boolean().optional(),
});

export type ExamResult = z.infer<typeof examResultSchema>;

// Report Reflection Schema (editable by parents/students via shared link)
export const reportReflectionSchema = z.object({
  parentReflection: z.string().optional(),
  parentSignedAt: z.string().optional(),
  studentReflection: z.string().optional(),
  studentSignedAt: z.string().optional(),
});

export type ReportReflection = z.infer<typeof reportReflectionSchema>;

// Report Signature Schema (digital signatures with cursive display)
export const reportSignatureSchema = z.object({
  classroomTeacher: z.object({
    name: z.string(),
    signedAt: z.string(),
  }).optional(),
  headOfSchool: z.object({
    name: z.string(),
    signedAt: z.string(),
  }).optional(),
});

export type ReportSignature = z.infer<typeof reportSignatureSchema>;

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
  shareToken: z.string().optional(),
  sharedAt: z.string().optional(),
  // Phase 1: New fields for exam results, reflections, and signatures
  examResults: z.array(examResultSchema).optional(),
  reflections: reportReflectionSchema.optional(),
  signatures: reportSignatureSchema.optional(),
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
