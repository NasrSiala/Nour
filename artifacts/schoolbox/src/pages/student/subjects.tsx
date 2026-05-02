import { useState } from "react";
import { useListSubjects, getListSubjectsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Search, BookOpen, ChevronRight, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const subjectGradients = [
  { from: "from-emerald-500", to: "to-teal-600", light: "bg-emerald-50", text: "text-emerald-700" },
  { from: "from-blue-500", to: "to-indigo-600", light: "bg-blue-50", text: "text-blue-700" },
  { from: "from-violet-500", to: "to-purple-600", light: "bg-violet-50", text: "text-violet-700" },
  { from: "from-orange-500", to: "to-amber-600", light: "bg-orange-50", text: "text-orange-700" },
  { from: "from-pink-500", to: "to-rose-600", light: "bg-pink-50", text: "text-pink-700" },
  { from: "from-cyan-500", to: "to-sky-600", light: "bg-cyan-50", text: "text-cyan-700" },
];

export default function SubjectsPage() {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  const { data: subjects, isLoading } = useListSubjects({}, {
    query: { queryKey: getListSubjectsQueryKey({}) },
  });

  const filtered = subjects?.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase());
    const matchGrade = gradeFilter === "all" || s.gradeLevel === Number(gradeFilter);
    return matchSearch && matchGrade;
  }) ?? [];

  const grades = [...new Set(subjects?.map(s => s.gradeLevel) ?? [])].sort();
  const totalLessons = subjects?.reduce((acc, s) => acc + (s.lessonCount ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Matières</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Explorez le programme pédagogique</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="text-center px-4 py-2 rounded-xl bg-primary/8 border border-primary/15">
              <p className="text-xs text-muted-foreground">Matières</p>
              <p className="text-lg font-bold text-primary">{subjects?.length ?? 0}</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-primary/8 border border-primary/15">
              <p className="text-xs text-muted-foreground">Leçons</p>
              <p className="text-lg font-bold text-primary">{totalLessons}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-3"
      >
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
            <SelectValue placeholder="Toutes les classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les classes</SelectItem>
            {grades.map(g => (
              <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-25" />
          <p className="font-medium">Aucune matière trouvée</p>
          <p className="text-sm mt-1">Essayez un autre terme ou filtre</p>
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
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  layout
                >
                  <Link href={`/student/subjects/${subject.id}`}>
                    <div className="group relative overflow-hidden rounded-2xl border border-border bg-white hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer h-full">
                      {/* Top gradient bar */}
                      <div className={`h-1.5 w-full bg-gradient-to-r ${grad.from} ${grad.to}`} />

                      <div className="p-5">
                        {/* Icon + title */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${grad.from} ${grad.to} shadow-sm`}>
                            <BookOpen className="h-5 w-5 text-white" />
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
                        </div>

                        <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors">
                          {subject.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{subject.code}</p>

                        {subject.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                            {subject.description}
                          </p>
                        )}

                        {/* Footer chips */}
                        <div className="flex items-center gap-2 mt-4 flex-wrap">
                          <Badge variant="outline" className={`text-xs ${grad.text} border-current/30 ${grad.light}`}>
                            Grade {subject.gradeLevel}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {subject.lessonCount} leçon{subject.lessonCount !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
