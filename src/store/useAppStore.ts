import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SchoolYear, Grade, AssessmentTemplate, Student, StudentReport, AssessmentPoint, AppSettings, TeacherAssignment, ExamResult, ReportReflection, ReportSignature } from '@/types';

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
  updateReportShareToken: (id: string, token: string) => void;
  getReportByShareToken: (token: string) => StudentReport | undefined;
  
  // Exam Results, Reflections, Signatures
  addExamResult: (reportId: string, examResult: ExamResult) => void;
  updateExamResult: (reportId: string, examResultId: string, updates: Partial<ExamResult>) => void;
  deleteExamResult: (reportId: string, examResultId: string) => void;
  updateReportReflection: (reportId: string, reflection: Partial<ReportReflection>) => void;
  signReport: (reportId: string, role: 'classroomTeacher' | 'headOfSchool', name: string) => void;

  // App Settings
  appSettings: AppSettings;
  updateAppSettings: (settings: Partial<AppSettings>) => void;
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

// Grade 0-1 ID for reference
const grade01Id = generateId();

// Default grades with teacher assignments
const defaultGrades: Grade[] = [
  { 
    id: grade01Id, 
    name: 'Grade 0-1', 
    description: 'Early Years', 
    colorIndex: 0, 
    order: 0,
    classroomTeacher: 'Ms Carin',
    teacherAssignments: [
      { id: generateId(), subject: 'English', teacher: 'Ms Carin', category: 'core' },
      { id: generateId(), subject: 'Math', teacher: 'Ms Carin', category: 'core' },
      { id: generateId(), subject: 'Science', teacher: 'Ms Carin', category: 'core' },
      { id: generateId(), subject: 'Social Studies', teacher: 'Ms Carin/Ms Natalia', category: 'core' },
      { id: generateId(), subject: 'Dutch', teacher: 'Ms Carin', category: 'core' },
      { id: generateId(), subject: 'Literature', teacher: 'Ms Carin/Ms Natalia', category: 'core' },
      { id: generateId(), subject: 'Mental Math', teacher: 'Ms Carin', category: 'core' },
      { id: generateId(), subject: 'Art', teacher: 'Ms Tetiana', category: 'core' },
      { id: generateId(), subject: 'Drama', teacher: 'Ms Natalia', category: 'core' },
      { id: generateId(), subject: 'Jiu Jitsu', teacher: 'Mr Sam', category: 'core' },
      { id: generateId(), subject: 'STEAM, Robotics', teacher: 'Mr Roman', category: 'professional' },
      { id: generateId(), subject: 'CAD, Music (Choir)', teacher: 'Ms Arina', category: 'professional' },
      { id: generateId(), subject: 'CAD, Music (Piano)', teacher: 'Ms Arina', category: 'professional' },
    ],
  },
  { id: generateId(), name: 'Grade 2-3', description: 'Lower Primary', colorIndex: 1, order: 1 },
  { id: generateId(), name: 'Grade 4-5', description: 'Upper Primary', colorIndex: 2, order: 2 },
];

// Default app settings
const defaultAppSettings: AppSettings = {
  schoolName: 'TISA School',
  missionStatement: 'At TISA School, we empower each student to achieve academic and holistic excellence, develop their natural talents, and become globally-minded citizens who are socially responsible and successful.',
  statement: 'Tisa empowers each student to:\n• Respect themselves and others;\n• Develop a lifelong love of learning;\n• Contribute as a globally-minded citizen to achieve individual academic and holistic excellence.',
  vision: 'We inspire student learning:\n• Through a dynamic and caring environment;\n• With innovative and effective instructional strategies;\n• In collaborative relationships.',
  values: ['Respect', 'Integrity', 'Courage', 'Curiosity', 'Care'],
  gradingKey: '⭐⭐⭐ - Mostly\n⭐⭐ - Usually\n⭐ - Rarely',
  companyWritingStyle: '',
};

// Helper to create assessment points
const createPoint = (name: string, maxStars: number = 3): AssessmentPoint => ({
  id: generateId(),
  name,
  maxStars,
});

// Complete Grade 0-1 Assessment Template from TISA Report
const grade01Template: AssessmentTemplate = {
  id: generateId(),
  gradeId: grade01Id,
  schoolYearId: defaultSchoolYear.id,
  name: 'Student Progress Report - Semester 1 (Terms 1 & 2)',
  description: 'Complete assessment for Grade 0-1 covering all subjects and tracks',
  subjects: [
    // LEARNER PROFILE
    {
      id: generateId(),
      name: 'Learner Profile (PYP Criteria)',
      description: 'IB Primary Years Programme learner attributes',
      assessmentPoints: [
        createPoint('Communicator'),
        createPoint('Thinker'),
        createPoint('Inquirers'),
        createPoint('Courageous'),
        createPoint('Knowledgeable'),
        createPoint('Principled'),
        createPoint('Caring'),
        createPoint('Open-minded'),
        createPoint('Balanced'),
        createPoint('Reflective'),
      ],
    },
    // WORK HABITS
    {
      id: generateId(),
      name: 'Work Habits',
      description: 'Classroom behavior and learning habits',
      assessmentPoints: [
        createPoint('Displays enthusiasm in the classroom'),
        createPoint('Exhibits self-discipline'),
        createPoint('Participates in class discussions'),
        createPoint('Follows class procedures and instructions'),
        createPoint('Interacts well with peers'),
        createPoint('Is attentive during classes'),
        createPoint('Follows directions'),
        createPoint('Is polite and courteous'),
        createPoint('Is neatly dressed and follows dress code'),
        createPoint('Independently works during self-study sessions'),
        createPoint('Follows academic integrity'),
      ],
    },
    // ENGLISH - TERM 1
    {
      id: generateId(),
      name: 'English - Term 1',
      description: 'English language skills for Term 1',
      assessmentPoints: [
        // Writing
        createPoint('Writing: Trace letters'),
        createPoint('Writing: Match letters to pictures'),
        createPoint('Writing: Write missing parts of letters'),
        createPoint('Writing: Listen and write sounds they hear'),
        createPoint('Writing: Correct pencil grip'),
        // Reading
        createPoint('Reading: Listen to and recognise sounds'),
        createPoint('Reading: Say the first sound they hear in a word'),
        createPoint('Reading: Blend sounds together to make a full word'),
        createPoint('Reading: Read simple words by themselves'),
        createPoint('Reading: Match what they read to what it means'),
        createPoint('Reading: Understands simple written text'),
        // Speaking and listening
        createPoint('Speaking: Listen carefully to instructions'),
        createPoint('Speaking: Responds to questions clearly'),
        createPoint('Speaking: Shares ideas or retell stories'),
        createPoint('Speaking: Uses new vocabulary in conversation'),
        // Viewing and presenting
        createPoint('Viewing: Talks about what they see in pictures'),
        createPoint('Viewing: Connects pictures to words or ideas'),
        createPoint('Viewing: Draws or uses pictures to share ideas'),
      ],
    },
    // ENGLISH - TERM 2
    {
      id: generateId(),
      name: 'English - Term 2',
      description: 'English language skills for Term 2',
      assessmentPoints: [
        // Writing
        createPoint('Writing: Trace letters'),
        createPoint('Writing: Listen to and write the sounds I hear'),
        createPoint('Writing: Correct pencil grip'),
        createPoint('Writing: Use sentence COPS (Capital letters, Organisation, Punctuation, Spacing) rules'),
        // Reading
        createPoint('Reading: Segment simple words into sounds'),
        createPoint('Reading: Read and understand a sentence'),
        createPoint('Reading: Match what they read to what it means'),
        createPoint('Reading: Blend sounds together to make words'),
        // Speaking and listening
        createPoint('Speaking: Share ideas with peers'),
        createPoint('Speaking: Listen to and add to stories'),
        createPoint('Speaking: Talk clearly when telling a story to the class'),
        // Viewing and presenting
        createPoint('Viewing: Look carefully at pictures to understand ideas'),
        createPoint('Viewing: Talk about what they see in pictures'),
        createPoint('Viewing: Connect what they see to what they hear or read'),
      ],
    },
    // MATH - TERM 1
    {
      id: generateId(),
      name: 'Math - Term 1',
      description: 'Mathematics skills for Term 1',
      assessmentPoints: [
        // Numbers and Counting
        createPoint('Numbers: Recognise and trace numbers up to 50'),
        createPoint('Numbers: Count objects or verbally from 1-10 and beyond'),
        createPoint('Numbers: Match objects to numerals'),
        // Shapes and Patterns
        createPoint('Shapes: Recognize and name basic shapes'),
        createPoint('Shapes: Identify and extend simple patterns'),
        createPoint('Shapes: Sort objects by shape and color and understand simple spatial relationships'),
      ],
    },
    // MATH - TERM 2
    {
      id: generateId(),
      name: 'Math - Term 2',
      description: 'Mathematics skills for Term 2',
      assessmentPoints: [
        // Measurement, Comparison and Comparing Quantities
        createPoint('Measurement: Compare and describe objects as big or small'),
        createPoint('Measurement: Identify and compare objects as long or short'),
        createPoint('Measurement: Arrange objects or pictures from shortest to tallest'),
        createPoint('Measurement: Compare groups to show which has more, less, or if they are equal'),
        // Spatial Awareness and Positional Language
        createPoint('Spatial: Understands and uses words like above, below, next to, behind, in front'),
        createPoint('Spatial: Draw or place objects correctly to show spatial understanding'),
      ],
    },
    // SCIENCE - TERM 1
    {
      id: generateId(),
      name: 'Science - Term 1',
      description: 'Light and Shadow, Sound',
      assessmentPoints: [
        createPoint('Understand that a shadow is formed when light hits an opaque object'),
        createPoint('Understand that the shadow changes with the light source direction'),
        createPoint('Explore how shadows change with object position'),
        createPoint('Understand that sound is made by vibrations'),
        createPoint('Test that sound is made by vibrations'),
        createPoint('Show interest in the idea of visualizing vibrations'),
      ],
    },
    // SCIENCE - TERM 2
    {
      id: generateId(),
      name: 'Science - Term 2',
      description: 'Animals and Plants',
      assessmentPoints: [
        createPoint('Understand the basic needs of animals'),
        createPoint('Distinguish between animals that eat plants, meat, or both'),
        createPoint('Recognize animals that live nearby and their habitats'),
        createPoint('Understand that plants need sunlight, water, and soil'),
        createPoint('Understand how environmental changes affect plants'),
        createPoint('Understand that plants can look different to survive in different places'),
      ],
    },
    // SOCIAL STUDIES - TERM 1
    {
      id: generateId(),
      name: 'Social Studies - Term 1',
      description: 'Who we are: Our characteristics and interests make us who we are',
      assessmentPoints: [
        createPoint('Talk about their identity'),
        createPoint('Choose between their favorite ways to play'),
        createPoint('Can build relationships with classmates'),
        createPoint('Can reflect on themselves'),
      ],
    },
    // SOCIAL STUDIES - TERM 2
    {
      id: generateId(),
      name: 'Social Studies - Term 2',
      description: 'Where we are in place and time: Previous generations help us understand the past',
      assessmentPoints: [
        createPoint('Identify and name family members'),
        createPoint('Understand relationships between family members'),
        createPoint('Express what is unique about their family'),
        createPoint('Participate in group discussions about families'),
        createPoint('Recognize that families can be similar or different'),
      ],
    },
    // DUTCH - TERM 1
    {
      id: generateId(),
      name: 'Dutch - Term 1',
      description: 'Introduction to Dutch - Oral',
      assessmentPoints: [
        createPoint('Listen to and recognise sounds'),
        createPoint('Say the first sound they hear in a word'),
        createPoint('Blend sounds together to say a whole word'),
        createPoint('Read simple words by themselves'),
        createPoint('Match what they read to what it means'),
      ],
    },
    // DUTCH - TERM 2
    {
      id: generateId(),
      name: 'Dutch - Term 2',
      description: 'Introduction to Dutch - Written',
      assessmentPoints: [
        createPoint('Trace letters'),
        createPoint('Use sentence COPS (Capital letters, Organisation, Punctuation, Spacing) rules'),
        createPoint('Read and understand the sentence'),
        createPoint('Listen and write sounds they hear'),
        createPoint('Hold their pencil carefully'),
        createPoint('Read simple words by themselves'),
        createPoint('Segment simple words'),
        createPoint('Share their ideas with their friends'),
        createPoint('Listen to their friends and add to ideas'),
        createPoint('Talk clearly when they tell the story to the class'),
      ],
    },
    // LITERATURE - TERM 1
    {
      id: generateId(),
      name: 'Literature - Term 1',
      description: 'Listening & Speaking',
      assessmentPoints: [
        createPoint('Listen and recall story events'),
        createPoint('Show understanding of story order'),
        createPoint('Connect emotions and friendship to the poem'),
        createPoint('Recognise key story and poem words'),
        createPoint('Express understanding of the texts'),
      ],
    },
    // LITERATURE - TERM 2
    {
      id: generateId(),
      name: 'Literature - Term 2',
      description: 'Listening, Comprehension & Speaking Skills',
      assessmentPoints: [
        createPoint('Recall details from the story'),
        createPoint('Arrange story events in the correct order'),
        createPoint('Recall and recite a familiar rhyme'),
        createPoint('Demonstrate understanding through drawing and verbal expression'),
      ],
    },
    // MENTAL MATH - TERM 1
    {
      id: generateId(),
      name: 'Mental Math - Term 1',
      description: 'Abacus fundamentals',
      assessmentPoints: [
        createPoint('Abacus Knowledge'),
        createPoint('Number Recognition'),
        createPoint('Counting Objects'),
        createPoint('Simple Addition/Subtraction'),
        createPoint('Mental Visualization with Abacus'),
      ],
    },
    // MENTAL MATH - TERM 2
    {
      id: generateId(),
      name: 'Mental Math - Term 2',
      description: 'Abacus skills development',
      assessmentPoints: [
        createPoint('Name parts of the abacus and what it is used for'),
        createPoint('Recognise numbers up to 9 on the abacus'),
        createPoint('Count objects and show it on the abacus using correct finger placement'),
        createPoint('Add and subtract numbers up to 4 on the abacus using correct finger placement'),
        createPoint('Use mental abacus skills with numbers up to four'),
      ],
    },
    // VISUAL ARTS - TERM 1
    {
      id: generateId(),
      name: 'Visual Arts - Term 1',
      description: 'Lines, shapes, and observation',
      assessmentPoints: [
        createPoint('Can copy, recognise, and name different types of lines (straight, wavy, zigzag, curly)'),
        createPoint('Can combine lines to create and identify basic shapes'),
        createPoint('Understands the difference between geometric and organic shapes and uses them in artwork'),
        createPoint('Can observe real objects and represent basic form, size, and simple details'),
      ],
    },
    // VISUAL ARTS - TERM 2
    {
      id: generateId(),
      name: 'Visual Arts - Term 2',
      description: 'Drawing and colors',
      assessmentPoints: [
        createPoint('Can draw simple objects such as a tree, lantern, or animal'),
        createPoint('Knows the main colours of the rainbow and can recognise them in artworks'),
        createPoint('Can name and use warm and cold colours in painting'),
        createPoint('Can mix primary colours to create simple secondary colours with guidance'),
        createPoint('Knows how to use different art materials such as watercolours, gouache, soft pastels, and oil pastels'),
      ],
    },
    // DRAMA - TERM 1
    {
      id: generateId(),
      name: 'Drama - Term 1',
      description: 'Expression and imagination',
      assessmentPoints: [
        createPoint('Body expression: Act given animals using body expression'),
        createPoint('Reciting poetry: Recite nursery rhymes loudly and clearly'),
        createPoint('Imagination: Turn a pencil into something else'),
      ],
    },
    // DRAMA - TERM 2
    {
      id: generateId(),
      name: 'Drama - Term 2',
      description: 'Performance skills',
      assessmentPoints: [
        createPoint('Rehearsal and staging'),
        createPoint('Performing on the stage'),
        createPoint('Reciting poetry (Hug or War - S. Silverstein)'),
      ],
    },
    // JIU JITSU - TERM 1 & 2
    {
      id: generateId(),
      name: 'Jiu Jitsu',
      description: 'Martial arts training',
      assessmentPoints: [
        createPoint('Term 1: Technical skills'),
        createPoint('Term 1: Discipline and focus'),
        createPoint('Term 1: Sportsmanship'),
        createPoint('Term 2: Technical skills'),
        createPoint('Term 2: Discipline and focus'),
        createPoint('Term 2: Sportsmanship'),
      ],
    },
    // ROBOTICS - TERM 1
    {
      id: generateId(),
      name: 'Robotics - Term 1 (STEAM Track)',
      description: 'Introduction to robotics',
      assessmentPoints: [
        createPoint('Knowledge of parts: Knows the names of parts very well'),
        createPoint('Ability to assemble: Excellent assembly, with no teacher help'),
        createPoint('Teamwork: Gets along well with a teammate, helps if necessary'),
      ],
    },
    // ROBOTICS - TERM 2
    {
      id: generateId(),
      name: 'Robotics - Term 2 (STEAM Track)',
      description: 'Building and teamwork',
      assessmentPoints: [
        createPoint('Can assemble according to instructions with teacher help'),
        createPoint('Ability to assemble: Excellent assembly, with no teacher help'),
        createPoint('Teamwork: Gets along well with a teammate, helps if necessary'),
      ],
    },
    // MUSIC / CHOIR - TERM 1
    {
      id: generateId(),
      name: 'Music (Choir) - Term 1 (CAD Track)',
      description: 'Vocal skills development',
      assessmentPoints: [
        createPoint('Creation and exploring of sound: Ability to hear sound and reproduce it clearly'),
        createPoint('Simple vocal exercises: Legato and staccato performance'),
        createPoint('Breathing technique: Ability to perform basic breathing exercises'),
        createPoint('Diction and articulation: Clearly reproduce all consonant sounds'),
        createPoint('Performance and stage attitude: High concentration and focus on stage'),
      ],
    },
    // MUSIC / CHOIR - TERM 2
    {
      id: generateId(),
      name: 'Music (Choir) - Term 2 (CAD Track)',
      description: 'Advanced vocal skills',
      assessmentPoints: [
        createPoint('Creation and exploration of sound: Distinguish between high and low pitches'),
        createPoint('Simple vocal exercises: Legato and staccato in simple melodies'),
        createPoint('Breathing technique: Practice calm nasal inhalation and gentle exhalation'),
        createPoint('Diction and articulation: Clear pronunciation of vowels and consonants'),
        createPoint('Performance and stage attitude: Stand in formation, walk on stage, face the audience'),
      ],
    },
    // UNITS OF INQUIRY
    {
      id: generateId(),
      name: 'Units of Inquiry',
      description: 'Transdisciplinary learning themes',
      assessmentPoints: [
        createPoint('Unit 1 (Who we are): Understanding self through play'),
        createPoint('Unit 1: Build relationships through play'),
        createPoint('Unit 2 (Where we are in place and time): Understand how previous generations help us learn about the past'),
        createPoint('Unit 2: Shows curiosity about topics'),
        createPoint('Unit 2: Participates in cross-subject exploration'),
      ],
    },
  ],
};

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
      assessmentTemplates: [grade01Template],
      
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

      updateReportShareToken: (id, token) =>
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === id ? { ...r, shareToken: token, sharedAt: new Date().toISOString() } : r
          ),
        })),

      getReportByShareToken: (token) => {
        return get().reports.find((r) => r.shareToken === token);
      },

      // Exam Results
      addExamResult: (reportId, examResult) =>
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === reportId
              ? { ...r, examResults: [...(r.examResults || []), examResult], updatedAt: new Date().toISOString() }
              : r
          ),
        })),

      updateExamResult: (reportId, examResultId, updates) =>
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  examResults: (r.examResults || []).map((e) =>
                    e.id === examResultId ? { ...e, ...updates } : e
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        })),

      deleteExamResult: (reportId, examResultId) =>
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  examResults: (r.examResults || []).filter((e) => e.id !== examResultId),
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        })),

      // Reflections
      updateReportReflection: (reportId, reflection) =>
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  reflections: { ...(r.reflections || {}), ...reflection },
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        })),

      // Signatures
      signReport: (reportId, role, name) =>
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  signatures: {
                    ...(r.signatures || {}),
                    [role]: { name, signedAt: new Date().toISOString() },
                  },
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        })),

      // App Settings
      appSettings: defaultAppSettings,
      
      updateAppSettings: (settings) =>
        set((state) => ({
          appSettings: { ...state.appSettings, ...settings },
        })),
    }),
    {
      name: 'tisa-assessment-storage',
    }
  )
);
