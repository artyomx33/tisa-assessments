import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Users, 
  ClipboardList, 
  FileText,
  Plus,
  ArrowRight,
  Star
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const { grades, students, assessmentTemplates, reports, activeSchoolYearId } = useAppStore();
  
  const activeStudents = students.filter(s => s.schoolYearId === activeSchoolYearId);
  const activeAssessments = assessmentTemplates.filter(a => a.schoolYearId === activeSchoolYearId);
  const activeReports = reports.filter(r => r.schoolYearId === activeSchoolYearId);

  const stats = [
    { 
      label: 'Total Grades', 
      value: grades.length, 
      icon: GraduationCap, 
      color: 'from-primary to-primary-glow',
      link: '/grades'
    },
    { 
      label: 'Students', 
      value: activeStudents.length, 
      icon: Users, 
      color: 'from-accent to-star-filled',
      link: '/students'
    },
    { 
      label: 'Assessments', 
      value: activeAssessments.length, 
      icon: ClipboardList, 
      color: 'from-grade-2 to-grade-3',
      link: '/assessments'
    },
    { 
      label: 'Reports', 
      value: activeReports.length, 
      icon: FileText, 
      color: 'from-grade-4 to-grade-5',
      link: '/reports'
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2"
        >
          <h1 className="font-display text-3xl font-bold text-foreground">
            Welcome to TISA Assessments
          </h1>
          <p className="text-muted-foreground">
            Manage student progress reports with star ratings and AI-enhanced feedback
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} variants={itemVariants}>
                <Link to={stat.link}>
                  <Card className="group cursor-pointer overflow-hidden border-border/50 transition-all hover:border-primary/30 hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="font-display text-3xl font-bold">{stat.value}</p>
                        </div>
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-md transition-transform group-hover:scale-110`}>
                          <Icon className="h-6 w-6 text-primary-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="mb-4 font-display text-xl font-semibold">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-dashed border-2 border-border hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="h-4 w-4 text-primary" />
                  Add New Student
                </CardTitle>
                <CardDescription>Register a student for the current school year</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/students">
                  <Button variant="outline" size="sm" className="gap-2">
                    Go to Students <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-border hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="h-4 w-4 text-accent" />
                  Create Assessment
                </CardTitle>
                <CardDescription>Set up assessment templates with star criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/assessments">
                  <Button variant="outline" size="sm" className="gap-2">
                    Go to Assessments <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-border hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Star className="h-4 w-4 text-star-filled" />
                  Fill Report
                </CardTitle>
                <CardDescription>Complete a student's progress report</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/reports">
                  <Button variant="outline" size="sm" className="gap-2">
                    Go to Reports <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Grades Overview */}
        {grades.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">Grades Overview</h2>
              <Link to="/grades">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grades.slice(0, 6).map((grade, index) => {
                const gradeStudents = activeStudents.filter(s => s.gradeId === grade.id);
                const gradeAssessments = activeAssessments.filter(a => a.gradeId === grade.id);
                
                return (
                  <motion.div
                    key={grade.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Link to={`/grades/${grade.id}`}>
                      <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground font-bold text-sm"
                              style={{ 
                                backgroundColor: `hsl(var(--grade-${grade.colorIndex}))` 
                              }}
                            >
                              {grade.name.slice(0, 2)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{grade.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {gradeStudents.length} students • {gradeAssessments.length} assessments
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
