import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Calendar, Check, Building2, Target, Eye, Heart, X, Bot, Key, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const schoolYearFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  startYear: z.number().min(2000).max(2100),
  endYear: z.number().min(2000).max(2100),
});

type SchoolYearFormValues = z.infer<typeof schoolYearFormSchema>;

export default function SettingsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newValue, setNewValue] = useState('');
  const { schoolYears, addSchoolYear, setActiveSchoolYear, activeSchoolYearId, appSettings, updateAppSettings } = useAppStore();

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

  const handleAddValue = () => {
    if (newValue.trim()) {
      updateAppSettings({
        values: [...appSettings.values, newValue.trim()],
      });
      setNewValue('');
      toast.success('Value added');
    }
  };

  const handleRemoveValue = (index: number) => {
    const newValues = appSettings.values.filter((_, i) => i !== index);
    updateAppSettings({ values: newValues });
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="font-display text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage school years, school info, and app configuration</p>
        </div>

        {/* School Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              School Information
            </CardTitle>
            <CardDescription>
              This information appears on student progress reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">School Name</label>
              <Input
                placeholder="e.g., TISA School"
                value={appSettings.schoolName}
                onChange={(e) => updateAppSettings({ schoolName: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Mission Statement
              </label>
              <Textarea
                placeholder="Enter your school's mission statement..."
                value={appSettings.missionStatement}
                onChange={(e) => updateAppSettings({ missionStatement: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statement</label>
              <Textarea
                placeholder="Enter statement (use bullet points with •)"
                value={appSettings.statement}
                onChange={(e) => updateAppSettings({ statement: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Use • for bullet points</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Vision
              </label>
              <Textarea
                placeholder="Enter your school's vision..."
                value={appSettings.vision}
                onChange={(e) => updateAppSettings({ vision: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Values
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {appSettings.values.map((value, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 pr-1">
                    {value}
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(index)}
                      className="ml-1 hover:bg-destructive/20 rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a value (e.g., Respect)"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddValue())}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddValue}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Grading Key</label>
              <Textarea
                placeholder="e.g., ⭐⭐⭐ - Mostly&#10;⭐⭐ - Usually&#10;⭐ - Rarely"
                value={appSettings.gradingKey}
                onChange={(e) => updateAppSettings({ gradingKey: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Explains the star rating system on reports</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Writing Style Guide (for AI)</label>
              <Textarea
                placeholder="Describe the writing style for AI to use when rewriting comments..."
                value={appSettings.companyWritingStyle}
                onChange={(e) => updateAppSettings({ companyWritingStyle: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Used by AI when rewriting teacher comments</p>
            </div>
          </CardContent>
        </Card>

        {/* AI Provider Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Settings
            </CardTitle>
            <CardDescription>
              Configure the AI provider for comment rewriting. By default, Lovable AI is used (no setup required).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Provider</label>
              <Select
                value={appSettings.aiProvider}
                onValueChange={(value: 'lovable' | 'openai' | 'google' | 'anthropic') => 
                  updateAppSettings({ aiProvider: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AI Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lovable">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>Lovable AI (Default - No API Key Required)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="openai">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <span>OpenAI (GPT-4)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="google">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <span>Google (Gemini)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="anthropic">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <span>Anthropic (Claude)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {appSettings.aiProvider === 'lovable' 
                  ? 'Using Lovable AI - no configuration needed!'
                  : 'You need to provide your own API key below'}
              </p>
            </div>

            {appSettings.aiProvider === 'openai' && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  OpenAI API Key
                </label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={appSettings.openaiApiKey}
                  onChange={(e) => updateAppSettings({ openaiApiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Get your API key from platform.openai.com</p>
              </div>
            )}

            {appSettings.aiProvider === 'google' && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Google AI API Key
                </label>
                <Input
                  type="password"
                  placeholder="AI..."
                  value={appSettings.googleApiKey}
                  onChange={(e) => updateAppSettings({ googleApiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Get your API key from aistudio.google.com</p>
              </div>
            )}

            {appSettings.aiProvider === 'anthropic' && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Anthropic API Key
                </label>
                <Input
                  type="password"
                  placeholder="sk-ant-..."
                  value={appSettings.anthropicApiKey}
                  onChange={(e) => updateAppSettings({ anthropicApiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Get your API key from console.anthropic.com</p>
              </div>
            )}
          </CardContent>
        </Card>

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
