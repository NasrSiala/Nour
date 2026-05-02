import { useState } from "react";
import {
  useListSubjects,
  useCreateSubject,
  getListSubjectsQueryKey,
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
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const subjectGradients = [
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-sky-600",
];

const GRADE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function AdminSubjects() {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    gradeLevel: "",
    description: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subjects, isLoading } = useListSubjects(
    {},
    { query: { queryKey: getListSubjectsQueryKey({}) } }
  );

  const { mutate: createSubject, isPending } = useCreateSubject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey({}) });
        setOpen(false);
        setForm({ code: "", name: "", gradeLevel: "", description: "" });
        toast({ title: "Matière créée", description: `"${form.name}" a été ajoutée avec succès.` });
      },
      onError: () => {
        toast({ title: "Erreur", description: "Impossible de créer la matière.", variant: "destructive" });
      },
    },
  });

  const filtered = subjects?.filter(s => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase());
    const matchGrade = gradeFilter === "all" || s.gradeLevel === Number(gradeFilter);
    return matchSearch && matchGrade;
  }) ?? [];

  const grades = [...new Set(subjects?.map(s => s.gradeLevel) ?? [])].sort();
  const totalLessons = subjects?.reduce((a, s) => a + (s.lessonCount ?? 0), 0) ?? 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code || !form.name || !form.gradeLevel) return;
    createSubject({
      data: {
        code: form.code.toUpperCase().trim(),
        name: form.name.trim(),
        gradeLevel: Number(form.gradeLevel),
        description: form.description.trim() || null,
      },
    });
  }

  const canSubmit = form.code && form.name && form.gradeLevel;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Matières</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gérez le programme pédagogique et les matières
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Nouvelle matière
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                Ajouter une matière
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
                    className="uppercase"
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
                    required
                  >
                    <SelectTrigger id="grade">
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map(g => (
                        <SelectItem key={g} value={String(g)}>
                          Grade {g}
                        </SelectItem>
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

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gap-2"
                  disabled={!canSubmit || isPending}
                >
                  {isPending ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {isPending ? "Création..." : "Créer la matière"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Matières", value: subjects?.length ?? 0, icon: BookOpen, color: "text-primary bg-primary/10" },
          { label: "Leçons au total", value: totalLessons, icon: FileText, color: "text-blue-600 bg-blue-50" },
          { label: "Niveaux couverts", value: grades.length, icon: GraduationCap, color: "text-violet-600 bg-violet-50" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-white p-4 flex items-center gap-3"
          >
            <div className={`p-2.5 rounded-xl ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
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
          <SelectTrigger className="w-44 rounded-xl">
            <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Tous les niveaux" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les niveaux</SelectItem>
            {grades.map(g => (
              <SelectItem key={g} value={String(g)}>
                Grade {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-border bg-muted/30">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">Aucune matière trouvée</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search || gradeFilter !== "all"
              ? "Modifiez vos filtres"
              : "Commencez par créer une matière"}
          </p>
          {!search && gradeFilter === "all" && (
            <Button className="mt-4 gap-2" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Créer la première matière
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
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  layout
                >
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-white hover:shadow-md transition-all duration-200 h-full">
                    {/* Gradient top bar */}
                    <div className={`h-1.5 w-full bg-gradient-to-r ${grad}`} />
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${grad} shadow-sm shrink-0`}>
                          <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {subject.isActive ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inactif</Badge>
                          )}
                        </div>
                      </div>

                      <h3 className="font-bold text-base leading-tight">{subject.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{subject.code}</p>

                      {subject.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                          {subject.description}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          Grade {subject.gradeLevel}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {subject.lessonCount} leçon{subject.lessonCount !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
