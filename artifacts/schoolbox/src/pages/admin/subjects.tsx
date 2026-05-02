import { useState, useEffect, useCallback } from "react";
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
            Code *
          </Label>
          <Input
            id="code"
            placeholder="ex: MATH-G5"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
            className="uppercase font-mono"
            maxLength={12}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="grade" className="flex items-center gap-1.5 text-xs font-semibold">
            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
            Niveau *
          </Label>
          <Select
            value={form.gradeLevel}
            onValueChange={v => setForm(f => ({ ...f, gradeLevel: v }))}
          >
            <SelectTrigger id="grade">
              <SelectValue placeholder="Choisir" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_LEVELS.map(g => (
                <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="name" className="flex items-center gap-1.5 text-xs font-semibold">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          Nom de la matière *
        </Label>
        <Input
          id="name"
          placeholder="ex: Mathématiques"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="teacher" className="flex items-center gap-1.5 text-xs font-semibold">
          <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
          Enseignant responsable
          <span className="text-muted-foreground font-normal">(optionnel)</span>
        </Label>
        <Select
          value={form.teacherId}
          onValueChange={v => setForm(f => ({ ...f, teacherId: v === "none" ? "" : v }))}
        >
          <SelectTrigger id="teacher">
            <SelectValue placeholder="Choisir un enseignant…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Aucun enseignant —</SelectItem>
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
          Description
          <span className="text-muted-foreground font-normal">(optionnel)</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Décrivez brièvement le contenu de la matière..."
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3}
          className="resize-none"
        />
      </div>
    </div>
  );
}

export default function AdminSubjects() {
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
        toast({ title: "Matière créée", description: `"${s.name}" ajoutée avec succès.` });
      },
      onError: () => toast({ title: "Erreur", description: "Impossible de créer la matière.", variant: "destructive" }),
    },
  });

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
      toast({ title: "Matière mise à jour", description: `"${editForm.name}" modifiée avec succès.` });
    } catch {
      toast({ title: "Erreur", description: "Impossible de modifier la matière.", variant: "destructive" });
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
        title: s.isActive ? "Matière désactivée" : "Matière activée",
        description: `"${s.name}" ${s.isActive ? "désactivée" : "activée"}.`,
      });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
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
      toast({ title: "Matière supprimée", description: `"${deleteSubject.name}" supprimée.` });
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer la matière.", variant: "destructive" });
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Matières</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gérez le programme pédagogique</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-lg px-2.5 py-1.5">
            <Keyboard className="h-3.5 w-3.5" />
            Appuyez sur <kbd className="font-mono font-bold">N</kbd> pour créer
          </span>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle matière
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total matières", value: subjects?.length ?? 0, icon: BookOpen, color: "text-primary bg-primary/10" },
          { label: "Actives", value: activeCount, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
          { label: "Leçons", value: totalLessons, icon: FileText, color: "text-blue-600 bg-blue-50" },
          { label: "Niveaux", value: grades.length, icon: GraduationCap, color: "text-violet-600 bg-violet-50" },
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une matière..."
            className="pl-9 rounded-xl"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-40 rounded-xl">
            <GraduationCap className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Tous les niveaux" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les niveaux</SelectItem>
            {grades.map(g => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortKey} onValueChange={v => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-40 rounded-xl">
            <ArrowUpDown className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grade">Par niveau</SelectItem>
            <SelectItem value="name">Par nom</SelectItem>
            <SelectItem value="lessons">Par leçons</SelectItem>
            <SelectItem value="created">Plus récents</SelectItem>
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
          <p className="font-medium text-muted-foreground">Aucune matière trouvée</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search || gradeFilter !== "all" ? "Modifiez vos filtres" : "Commencez par créer une matière"}
          </p>
          {!search && gradeFilter === "all" && (
            <Button className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />Créer la première matière
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
                        <h3 className="font-bold text-[15px] leading-snug text-foreground flex-1 min-w-0">
                          {subject.name}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0 -mt-0.5">
                          {subject.isActive ? (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                              Actif
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              Inactif
                            </span>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => openEdit(subject)} className="gap-2">
                                <Pencil className="h-3.5 w-3.5" />Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(subject)} className="gap-2">
                                {subject.isActive
                                  ? <><ToggleLeft className="h-3.5 w-3.5" />Désactiver</>
                                  : <><ToggleRight className="h-3.5 w-3.5" />Activer</>
                                }
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteSubject(subject)}
                                className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Grade + code — one line */}
                      <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                        Grade {subject.gradeLevel}
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
                          {subject.lessonCount} leçon{subject.lessonCount !== 1 ? "s" : ""}
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
              Ajouter une matière
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <SubjectFormFields form={createForm} setForm={setCreateForm} />
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1 gap-2" disabled={!createForm.code || !createForm.name || !createForm.gradeLevel || creating}>
                {creating ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {creating ? "Création..." : "Créer"}
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
              Modifier la matière
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-2">
            <SubjectFormFields form={editForm} setForm={setEditForm} />
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditSubject(null)}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1 gap-2" disabled={!editForm.code || !editForm.name || !editForm.gradeLevel || saving}>
                {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE confirmation */}
      <AlertDialog open={!!deleteSubject} onOpenChange={v => { if (!v) setDeleteSubject(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Supprimer « {deleteSubject?.name} » ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(deleteSubject?.lessonCount ?? 0) > 0 ? (
                <span className="text-amber-700 font-medium">
                  ⚠️ Cette matière contient {deleteSubject?.lessonCount} leçon{deleteSubject!.lessonCount > 1 ? "s" : ""}. 
                  Toutes seront supprimées définitivement.
                </span>
              ) : (
                "Cette action est irréversible. La matière sera définitivement supprimée."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {deleting ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? "Suppression..." : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
