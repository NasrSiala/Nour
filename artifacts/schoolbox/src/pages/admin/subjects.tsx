import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  useListSubjects,
  useCreateSubject,
  getListSubjectsQueryKey,
  useListUsers,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  BookOpen,
  Search,
  GraduationCap,
  Hash,
  FileText,
  CheckCircle2,
  MoreVertical,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ArrowUpDown,
  Keyboard,
  UserCheck,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const subjectGradients = [
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-sky-600",
];

const GRADE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

type Subject = {
  id: number;
  code: string;
  name: string;
  gradeLevel: number;
  description?: string | null;
  teacherId?: number | null;
  teacherName?: string | null;
  isActive: boolean;
  lessonCount: number;
  createdAt: string;
};

type SortKey = "name" | "grade" | "lessons" | "created";

const emptyForm = { code: "", name: "", gradeLevel: "", description: "", teacherId: "" };

function SubjectFormFields({
  form,
  setForm,
}: {
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
}) {
  const { t } = useTranslation();
  const { data: teachers } = useListUsers(
    { role: "teacher" },
    { query: { queryKey: [...getListUsersQueryKey({ role: "teacher" })] } }
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="code" className="flex items-center gap-1.5 text-xs font-semibold">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            {t("subjectCode")} *
          </Label>
          <Input
            id="code"
            placeholder="ex: MATH-G5"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
            className="uppercase font-mono text-inline-start"
            maxLength={12}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="grade" className="flex items-center gap-1.5 text-xs font-semibold">
            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
            {t("grade")} *
          </Label>
          <Select
            value={form.gradeLevel}
            onValueChange={v => setForm(f => ({ ...f, gradeLevel: v }))}
          >
            <SelectTrigger id="grade" className="text-inline-start">
              <SelectValue placeholder={t("gradePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {GRADE_LEVELS.map(g => (
                <SelectItem key={g} value={String(g)}>{t("grade")} {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="name" className="flex items-center gap-1.5 text-xs font-semibold">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          {t("subjectName")} *
        </Label>
        <Input
          id="name"
          placeholder="ex: Mathématiques"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="text-inline-start"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="teacher" className="flex items-center gap-1.5 text-xs font-semibold">
          <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
          {t("subjectTeacher")}
          <span className="text-muted-foreground font-normal ps-1">({t("optional")})</span>
        </Label>
        <Select
          value={form.teacherId}
          onValueChange={v => setForm(f => ({ ...f, teacherId: v === "none" ? "" : v }))}
        >
          <SelectTrigger id="teacher" className="text-inline-start">
            <SelectValue placeholder={t("chooseTeacher")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("noTeacherSelected")}</SelectItem>
            {(teachers ?? []).map(t => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description" className="flex items-center gap-1.5 text-xs font-semibold">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          {t("subjectDescription")}
          <span className="text-muted-foreground font-normal ps-1">({t("optional")})</span>
        </Label>
        <Textarea
          id="description"
          placeholder="..."
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3}
          className="resize-none text-inline-start"
        />
      </div>
    </div>
  );
}

type ParsedRow = { code: string; name: string; gradeLevel: number; description: string; teacherUsername: string; _valid: boolean; _error?: string };

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    const [code = "", name = "", gradeLevelRaw = "", description = "", teacherUsername = ""] = cols;
    const gradeLevel = parseInt(gradeLevelRaw, 10);
    const valid = !!code && !!name && !isNaN(gradeLevel) && gradeLevel >= 1 && gradeLevel <= 12;
    rows.push({ code: code.toUpperCase(), name, gradeLevel: isNaN(gradeLevel) ? 0 : gradeLevel, description, teacherUsername, _valid: valid, _error: !valid ? "Code, name, and valid grade (1-12) are required" : undefined });
  }
  return rows;
}

const CSV_TEMPLATE = `code,name,gradeLevel,description,teacherUsername\nMATH-G3,Mathématiques Grade 3,3,Arithmétique et géométrie,teacher1\nFR-G3,Français Grade 3,3,Lecture et expression écrite,\n`;

type ImportResult = { created: number; skipped: number; errors: number; results: { row: number; status: string; code?: string; reason?: string }[] };

export default function AdminSubjects() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("grade");
  const [createOpen, setCreateOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [deleteSubject, setDeleteSubject] = useState<Subject | null>(null);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subjects, isLoading } = useListSubjects(
    {},
    { query: { queryKey: getListSubjectsQueryKey({}) } }
  );

  const { mutate: createSubject, isPending: creating } = useCreateSubject({
    mutation: {
      onSuccess: (s) => {
        queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey({}) });
        setCreateOpen(false);
        setCreateForm(emptyForm);
        toast({ title: t("subjectCreated"), description: `"${s.name}" ${t("added")}.` });
      },
      onError: () => toast({ title: t("error"), description: t("errorCreatingSubject"), variant: "destructive" }),
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setImportRows(parseCSV(text));
      setImportResult(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImportSubmit = async () => {
    const valid = importRows.filter(r => r._valid);
    if (!valid.length) return;
    setImporting(true);
    try {
      const token = localStorage.getItem("schoolbox_token");
      const res = await fetch(`${BASE}/api/subjects/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rows: valid.map(r => ({ code: r.code, name: r.name, gradeLevel: r.gradeLevel, description: r.description || null, teacherUsername: r.teacherUsername || null })) }),
      });
      const data: ImportResult = await res.json();
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey({}) });
      toast({ title: t("importResults"), description: `${data.created} ${t("createdCount")} · ${data.skipped} ${t("skippedCount")} · ${data.errors} ${t("errorsCount")}` });
    } catch {
      toast({ title: t("error"), description: t("error"), variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "subjects_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // Keyboard shortcut: N = new subject
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "n" || e.key === "N") && !e.ctrlKey && !e.metaKey &&
        !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        setCreateOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const openEdit = useCallback((s: Subject) => {
    setEditSubject(s);
    setEditForm({
      code: s.code,
      name: s.name,
      gradeLevel: String(s.gradeLevel),
      description: s.description ?? "",
      teacherId: s.teacherId ? String(s.teacherId) : "",
    });
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.code || !createForm.name || !createForm.gradeLevel) return;
    createSubject({
      data: {
        code: createForm.code.toUpperCase().trim(),
        name: createForm.name.trim(),
        gradeLevel: Number(createForm.gradeLevel),
        description: createForm.description.trim() || null,
        teacherId: createForm.teacherId ? Number(createForm.teacherId) : null,
      },
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSubject || !editForm.code || !editForm.name || !editForm.gradeLevel) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("schoolbox_token");
      const res = await fetch(`${BASE}/api/subjects/${editSubject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code: editForm.code.toUpperCase().trim(),
          name: editForm.name.trim(),
          gradeLevel: Number(editForm.gradeLevel),
          description: editForm.description.trim() || null,
          teacherId: editForm.teacherId ? Number(editForm.teacherId) : null,
        }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey({}) });
      setEditSubject(null);
      toast({ title: t("subjectUpdated"), description: `"${editForm.name}" ${t("subjectUpdated")}.` });
    } catch {
      toast({ title: t("error"), description: t("error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s: Subject) => {
    try {
      const token = localStorage.getItem("schoolbox_token");
      await fetch(`${BASE}/api/subjects/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey({}) });
      toast({
        title: s.isActive ? t("deactivateSubject") : t("activateSubject"),
        description: `"${s.name}" ${s.isActive ? t("inactive") : t("active")}.`,
      });
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteSubject) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("schoolbox_token");
      const res = await fetch(`${BASE}/api/subjects/${deleteSubject.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey({}) });
      setDeleteSubject(null);
      toast({ title: t("subjectDeleted"), description: `"${deleteSubject.name}" ${t("subjectDeleted")}.` });
    } catch {
      toast({ title: t("error"), description: t("error"), variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const filtered = (subjects ?? [])
    .filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase());
      const matchGrade = gradeFilter === "all" || s.gradeLevel === Number(gradeFilter);
      return matchSearch && matchGrade;
    })
    .sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "grade") return a.gradeLevel - b.gradeLevel || a.name.localeCompare(b.name);
      if (sortKey === "lessons") return b.lessonCount - a.lessonCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const grades = [...new Set((subjects ?? []).map(s => s.gradeLevel))].sort();
  const totalLessons = (subjects ?? []).reduce((a, s) => a + (s.lessonCount ?? 0), 0);
  const activeCount = (subjects ?? []).filter(s => s.isActive).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="text-inline-start">
          <h1 className="text-2xl font-bold tracking-tight">{t("subjectsTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t("subjectsSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-lg px-2.5 py-1.5">
            <Keyboard className="h-3.5 w-3.5" />
            {t("keyboardHint").split("N")[0]} <kbd className="font-mono font-bold">N</kbd> {t("keyboardHint").split("N")[1]}
          </span>
          <Button variant="outline" className="gap-2" onClick={() => { setImportOpen(true); setImportRows([]); setImportResult(null); }}>
            <FileSpreadsheet className="h-4 w-4" />
            {t("importCSV")}
          </Button>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("newSubject")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("totalSubjects"), value: subjects?.length ?? 0, icon: BookOpen, color: "text-primary bg-primary/10" },
          { label: t("active"), value: activeCount, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
          { label: t("lessons"), value: totalLessons, icon: FileText, color: "text-blue-600 bg-blue-50" },
          { label: t("levels"), value: grades.length, icon: GraduationCap, color: "text-violet-600 bg-violet-50" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-white p-4 flex items-center gap-3"
          >
            <div className={`p-2.5 rounded-xl ${stat.color} shrink-0`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-black leading-none">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchSubjects")}
            className="ps-9 rounded-xl text-inline-start"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-40 rounded-xl text-inline-start">
            <GraduationCap className="h-4 w-4 me-1.5 text-muted-foreground" />
            <SelectValue placeholder={t("allLevels")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allLevels")}</SelectItem>
            {grades.map(g => <SelectItem key={g} value={String(g)}>{t("grade")} {g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortKey} onValueChange={v => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-40 rounded-xl text-inline-start">
            <ArrowUpDown className="h-4 w-4 me-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grade">{t("sortByLevel")}</SelectItem>
            <SelectItem value="name">{t("sortByName")}</SelectItem>
            <SelectItem value="lessons">{t("sortByLessons")}</SelectItem>
            <SelectItem value="created">{t("sortByRecent")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-border bg-muted/30">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">{t("noSubjectsFound")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search || gradeFilter !== "all" ? t("tryDifferentTerm") : t("createFirstSubject")}
          </p>
          {!search && gradeFilter === "all" && (
            <Button className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />{t("createFirstSubject")}
            </Button>
          )}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((subject, i) => {
              const grad = subjectGradients[subject.id % subjectGradients.length];
              return (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ delay: i * 0.035, duration: 0.25 }}
                  layout
                >
                  <div className={`relative overflow-hidden rounded-2xl border bg-white transition-all duration-200 h-full flex flex-col ${
                    subject.isActive
                      ? "border-border hover:border-primary/20 hover:shadow-[0_4px_24px_-4px_rgba(11,40,25,0.10)]"
                      : "border-border/40 opacity-55"
                  }`}>
                    {/* Accent bar */}
                    <div className={`h-[3px] w-full bg-gradient-to-r ${grad} ${!subject.isActive ? "opacity-40" : ""}`} />

                    <div className="p-5 flex flex-col flex-1">
                      {/* Title + controls row */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-[15px] leading-snug text-foreground flex-1 min-w-0 text-inline-start">
                          {subject.name}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0 -mt-0.5">
                          {subject.isActive ? (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                              {t("active")}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {t("inactive")}
                            </span>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 me-[-4px] text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => openEdit(subject)} className="gap-2 text-inline-start">
                                <Pencil className="h-3.5 w-3.5" />{t("edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(subject)} className="gap-2 text-inline-start">
                                {subject.isActive
                                  ? <><ToggleLeft className="h-3.5 w-3.5" />{t("deactivate")}</>
                                  : <><ToggleRight className="h-3.5 w-3.5" />{t("activateSubject")}</>
                                }
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteSubject(subject)}
                                className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 text-inline-start"
                              >
                                <Trash2 className="h-3.5 w-3.5" />{t("delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Grade + code — one line */}
                      <p className="text-[11px] text-muted-foreground mt-1 font-medium text-inline-start">
                        {t("grade")} {subject.gradeLevel}
                        <span className="mx-1.5 opacity-30">·</span>
                        <span className="font-mono">{subject.code}</span>
                      </p>

                      {/* Description */}
                      {subject.description && (
                        <p className="text-[12px] text-muted-foreground mt-2.5 line-clamp-2 leading-relaxed">
                          {subject.description}
                        </p>
                      )}

                      {/* Teacher tag */}
                      {subject.teacherName ? (
                        <div className="flex items-center gap-1.5 mt-2.5">
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <p className="text-[11px] text-emerald-700 font-medium truncate">{subject.teacherName}</p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/50 mt-2 italic">Aucun enseignant</p>
                      )}

                      {/* Footer — lesson count right-aligned */}
                      <div className="flex items-center justify-end mt-auto pt-4 border-t border-border/60 mt-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg">
                          <FileText className="h-3 w-3" />
                          {subject.lessonCount} {t("lesson")}{subject.lessonCount !== 1 ? t("s") : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* CREATE dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              {t("newSubject")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <SubjectFormFields form={createForm} setForm={setCreateForm} />
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" className="flex-1 gap-2" disabled={!createForm.code || !createForm.name || !createForm.gradeLevel || creating}>
                {creating ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {creating ? t("loading") : t("save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT dialog */}
      <Dialog open={!!editSubject} onOpenChange={v => { if (!v) setEditSubject(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50">
                <Pencil className="h-4 w-4 text-blue-600" />
              </div>
              {t("edit")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-2">
            <SubjectFormFields form={editForm} setForm={setEditForm} />
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditSubject(null)}>
                {t("cancel")}
              </Button>
              <Button type="submit" className="flex-1 gap-2" disabled={!editForm.code || !editForm.name || !editForm.gradeLevel || saving}>
                {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {saving ? t("loading") : t("save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* CSV IMPORT dialog */}
      <Dialog open={importOpen} onOpenChange={v => { setImportOpen(v); if (!v) { setImportRows([]); setImportResult(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-50">
                <FileSpreadsheet className="h-4 w-4 text-violet-600" />
              </div>
              {t("importTitle")}
            </DialogTitle>
          </DialogHeader>
 
          <div className="flex-1 overflow-y-auto space-y-4 pt-2">
            {/* Format guide */}
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2 text-inline-start">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("requiredFormat")}</p>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <Download className="h-3.5 w-3.5" /> {t("downloadTemplate")}
                </button>
              </div>
              <code className="text-xs font-mono text-muted-foreground block">
                code, name, gradeLevel, description, teacherUsername
              </code>
              <p className="text-[11px] text-muted-foreground">
                {t("teacherUsername")} {t("optional")}. {t("grade")} {t("mustBeBetween")} 1-12.
              </p>
            </div>
            {/* File picker */}
            {!importResult && (
              <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-primary/5 p-8 cursor-pointer transition-colors">
                <div className="p-3 rounded-full bg-primary/10">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">{t("clickToSelectCSV") || "Cliquez pour sélectionner un fichier CSV"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("orDragDrop") || "ou glissez-déposez ici"}</p>
                </div>
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
              </label>
            )}

            {/* Preview table */}
            {importRows.length > 0 && !importResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{importRows.length} lignes détectées</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle className="h-3.5 w-3.5" /> {importRows.filter(r => r._valid).length} valides</span>
                    {importRows.some(r => !r._valid) && (
                      <span className="flex items-center gap-1 text-red-500 font-semibold"><XCircle className="h-3.5 w-3.5" /> {importRows.filter(r => !r._valid).length} invalides</span>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="overflow-x-auto max-h-48">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted/60 border-b border-border">
                          {["#", t("subjectCode"), t("subjectName"), t("grade"), t("subjectDescription"), t("teacher"), ""].map(h => (
                            <th key={h} className="px-3 py-2 text-inline-start font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importRows.map((row, i) => (
                          <tr key={i} className={`border-b border-border/50 ${row._valid ? "" : "bg-red-50"}`}>
                            <td className="px-3 py-2 text-muted-foreground font-mono">{i + 1}</td>
                            <td className="px-3 py-2 font-mono font-bold">{row.code || <span className="text-red-400">—</span>}</td>
                            <td className="px-3 py-2 max-w-32 truncate">{row.name || <span className="text-red-400">—</span>}</td>
                            <td className="px-3 py-2">{row.gradeLevel > 0 ? `G${row.gradeLevel}` : <span className="text-red-400">—</span>}</td>
                            <td className="px-3 py-2 max-w-40 truncate text-muted-foreground">{row.description || "—"}</td>
                            <td className="px-3 py-2 text-muted-foreground">{row.teacherUsername || "—"}</td>
                            <td className="px-3 py-2">
                              {row._valid
                                ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                : <span title={row._error}><AlertCircle className="h-3.5 w-3.5 text-red-500" /></span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Result */}
            {importResult && (
              <div className="rounded-xl border border-border p-5 space-y-4">
                <p className="text-sm font-bold">{t("importResults")}</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: t("createdCount"), value: importResult.created, color: "text-emerald-600 bg-emerald-50", icon: CheckCircle },
                    { label: t("skippedCount"), value: importResult.skipped, color: "text-amber-600 bg-amber-50", icon: AlertCircle },
                    { label: t("errorsCount"), value: importResult.errors, color: "text-red-600 bg-red-50", icon: XCircle },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl p-4 ${s.color.split(" ")[1]} flex flex-col items-center gap-1`}>
                      <s.icon className={`h-5 w-5 ${s.color.split(" ")[0]}`} />
                      <p className={`text-2xl font-black ${s.color.split(" ")[0]}`}>{s.value}</p>
                      <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
                {importResult.results.filter(r => r.status !== "created").map(r => (
                  <div key={r.row} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono text-muted-foreground/60">{t("line")} {r.row}</span>
                    <span className="font-mono font-semibold">{r.code}</span>
                    <span>—</span>
                    <span className="text-amber-600">{r.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              onClick={() => { setImportOpen(false); setImportRows([]); setImportResult(null); }}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors"
            >
              {importResult ? t("close") : t("cancel")}
            </button>
            {!importResult && importRows.filter(r => r._valid).length > 0 && (
              <button
                onClick={handleImportSubmit}
                disabled={importing}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {importing ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Upload className="h-4 w-4" />}
                {importing ? t("importing") : `${t("importCSV")} ${importRows.filter(r => r._valid).length}`}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE confirmation */}
      <AlertDialog open={!!deleteSubject} onOpenChange={v => { if (!v) setDeleteSubject(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-inline-start">
              <Trash2 className="h-5 w-5 text-red-500" />
              {t("delete")} « {deleteSubject?.name} » ؟
            </AlertDialogTitle>
            <AlertDialogDescription className="text-inline-start">
              {(deleteSubject?.lessonCount ?? 0) > 0 ? (
                <span className="text-amber-700 font-medium">
                  ⚠️ {t("subjectContains")} {deleteSubject?.lessonCount} {t("lesson")}. 
                  {t("allWillBeDeleted")}.
                </span>
              ) : (
                t("irreversibleAction")
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {deleting ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? t("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
