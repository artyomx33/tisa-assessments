import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SchoolYear, Grade, AssessmentTemplate, Student, StudentReport } from '@/types';

interface AppState {
  // School Years
  schoolYears: SchoolYear[];
  activeSchoolYearId: string | null;
  addSchoolYear: (year: SchoolYear) => void;
  setActiveSchoolYear: (id: string) => void;
  
  // Grades
  grades: Grade[];
  addGrade: (grade: Grade) => void;
  updateGrade: (id: string, grade: Partial<Grade>) => void;
  deleteGrade: (id: string) => void;
  
  // Assessment Templates
  assessmentTemplates: AssessmentTemplate[];
  addAssessmentTemplate: (template: AssessmentTemplate) => void;
  updateAssessmentTemplate: (id: string, template: Partial<AssessmentTemplate>) => void;
  deleteAssessmentTemplate: (id: string) => void;
  
  // Students
  students: Student[];
  addStudent: (student: Student) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  
  // Reports
  reports: StudentReport[];
  addReport: (report: StudentReport) => void;
  updateReport: (id: string, report: Partial<StudentReport>) => void;
  deleteReport: (id: string) => void;
}

const generateId = () => crypto.randomUUID();

// Default school year
const defaultSchoolYear: SchoolYear = {
  id: generateId(),
  name: '2025-2026',
  startYear: 2025,
  endYear: 2026,
  isActive: true,
};

// Default grades
const defaultGrades: Grade[] = [
  { id: generateId(), name: 'Grade 0-1', description: 'Early Years', colorIndex: 0, order: 0 },
  { id: generateId(), name: 'Grade 2-3', description: 'Lower Primary', colorIndex: 1, order: 1 },
  { id: generateId(), name: 'Grade 4-5', description: 'Upper Primary', colorIndex: 2, order: 2 },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // School Years
      schoolYears: [defaultSchoolYear],
      activeSchoolYearId: defaultSchoolYear.id,
      
      addSchoolYear: (year) =>
        set((state) => ({
          schoolYears: [...state.schoolYears, year],
        })),
      
      setActiveSchoolYear: (id) =>
        set((state) => ({
          activeSchoolYearId: id,
          schoolYears: state.schoolYears.map((y) => ({
            ...y,
            isActive: y.id === id,
          })),
        })),
      
      // Grades
      grades: defaultGrades,
      
      addGrade: (grade) =>
        set((state) => ({
          grades: [...state.grades, grade],
        })),
      
      updateGrade: (id, updates) =>
        set((state) => ({
          grades: state.grades.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        })),
      
      deleteGrade: (id) =>
        set((state) => ({
          grades: state.grades.filter((g) => g.id !== id),
        })),
      
      // Assessment Templates
      assessmentTemplates: [],
      
      addAssessmentTemplate: (template) =>
        set((state) => ({
          assessmentTemplates: [...state.assessmentTemplates, template],
        })),
      
      updateAssessmentTemplate: (id, updates) =>
        set((state) => ({
          assessmentTemplates: state.assessmentTemplates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      
      deleteAssessmentTemplate: (id) =>
        set((state) => ({
          assessmentTemplates: state.assessmentTemplates.filter((t) => t.id !== id),
        })),
      
      // Students
      students: [],
      
      addStudent: (student) =>
        set((state) => ({
          students: [...state.students, student],
        })),
      
      updateStudent: (id, updates) =>
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      
      deleteStudent: (id) =>
        set((state) => ({
          students: state.students.filter((s) => s.id !== id),
        })),
      
      // Reports
      reports: [],
      
      addReport: (report) =>
        set((state) => ({
          reports: [...state.reports, report],
        })),
      
      updateReport: (id, updates) =>
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
      
      deleteReport: (id) =>
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        })),
    }),
    {
      name: 'tisa-assessment-storage',
    }
  )
);
