import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Calendar, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

const schoolYearFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  startYear: z.number().min(2000).max(2100),
  endYear: z.number().min(2000).max(2100),
});

type SchoolYearFormValues = z.infer<typeof schoolYearFormSchema>;

export default function SettingsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { schoolYears, addSchoolYear, setActiveSchoolYear, activeSchoolYearId } = useAppStore();

  const form = useForm<SchoolYearFormValues>({
    resolver: zodResolver(schoolYearFormSchema),
    defaultValues: {
      name: '',
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 1,
    },
  });

  const onSubmit = (data: SchoolYearFormValues) => {
    addSchoolYear({
      id: crypto.randomUUID(),
      ...data,
      isActive: false,
    });
    toast.success('School year added');
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-display text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage school years and app configuration</p>
        </div>

        {/* School Years */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  School Years
                </CardTitle>
                <CardDescription>
                  Manage school years. Assessments and students are organized by year.
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Year
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add School Year</DialogTitle>
                    <DialogDescription>
                      Create a new school year for organizing assessments
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 2025-2026" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Year</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="endYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Year</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Add School Year</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {schoolYears.map((year) => (
              <motion.div
                key={year.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                  year.id === activeSchoolYearId
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {year.id === activeSchoolYearId && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{year.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {year.startYear} - {year.endYear}
                    </p>
                  </div>
                </div>
                {year.id !== activeSchoolYearId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveSchoolYear(year.id);
                      toast.success(`Switched to ${year.name}`);
                    }}
                  >
                    Set Active
                  </Button>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <h3 className="mb-2 font-semibold">About TISA Assessments</h3>
            <p className="text-sm text-muted-foreground">
              This system helps manage student progress reports with star-based assessments.
              Teachers can input observations that are then rewritten in a consistent "TISA voice"
              using AI assistance.
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              <p>Data is stored locally in your browser.</p>
              <p className="mt-1">AI voice rewrite feature coming soon.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
