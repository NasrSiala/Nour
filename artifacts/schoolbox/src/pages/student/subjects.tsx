import { useState } from "react";
import { useListSubjects, getListSubjectsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Search, BookOpen, ChevronRight, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const subjectGradients = [
  { from: "from-emerald-500", to: "to-teal-600", light: "bg-emerald-50", text: "text-emerald-700" },
  { from: "from-blue-500", to: "to-indigo-600", light: "bg-blue-50", text: "text-blue-700" },
  { from: "from-violet-500", to: "to-purple-600", light: "bg-violet-50", text: "text-violet-700" },
  { from: "from-orange-500", to: "to-amber-600", light: "bg-orange-50", text: "text-orange-700" },
  { from: "from-pink-500", to: "to-rose-600", light: "bg-pink-50", text: "text-pink-700" },
  { from: "from-cyan-500", to: "to-sky-600", light: "bg-cyan-50", text: "text-cyan-700" },
];

export default function SubjectsPage() {
  const { t } = useTranslation();
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
            <h1 className="text-2xl font-bold tracking-tight">{t("subjects")}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{t("exploreCurriculum")}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="text-center px-4 py-2 rounded-xl bg-primary/8 border border-primary/15">
              <p className="text-xs text-muted-foreground">{t("subjects")}</p>
              <p className="text-lg font-bold text-primary">{subjects?.length ?? 0}</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-primary/8 border border-primary/15">
              <p className="text-xs text-muted-foreground">{t("lessons")}</p>
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
            placeholder={t("searchSubject")}
            className="pl-9 rounded-xl"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-44 rounded-xl">
            <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t("allGrades")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allGrades")}</SelectItem>
            {grades.map(g => (
              <SelectItem key={g} value={String(g)}>{t("grade")} {g}</SelectItem>
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
          <p className="font-medium">{t("noSubjectsFound")}</p>
          <p className="text-sm mt-1">{t("tryDifferentTerm")}</p>
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
                    <div className="group relative overflow-hidden rounded-2xl border border-border bg-white hover:border-primary/20 hover:shadow-[0_4px_24px_-4px_rgba(11,40,25,0.10)] transition-all duration-200 cursor-pointer h-full flex flex-col">
                      {/* Accent bar */}
                      <div className={`h-[3px] w-full bg-gradient-to-r ${grad.from} ${grad.to}`} />

                      <div className="p-5 flex flex-col flex-1">
                        {/* Title + arrow */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-[15px] leading-snug text-foreground group-hover:text-primary transition-colors flex-1 min-w-0">
                            {subject.name}
                          </h3>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors mt-0.5 shrink-0" />
                        </div>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold tracking-wider text-muted-foreground/80 bg-muted/50 px-1.5 py-0.5 rounded">
                            {subject.code}
                          </span>
                        </div>

                        <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {subject.description || t("noDescription")}
                        </p>

                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/40">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-primary" />
                            <span className="text-[11px] font-semibold text-foreground/80">
                              {subject.lessonCount || 0} {t("lessons")}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground/40 group-hover:text-primary/40 transition-colors uppercase tracking-widest">
                            {t("viewMore")}
                          </span>
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
