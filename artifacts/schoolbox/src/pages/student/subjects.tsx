import { useState } from "react";
import { useListSubjects, getListSubjectsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Search, BookOpen, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function SubjectsPage() {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  const { data: subjects, isLoading } = useListSubjects({}, { query: { queryKey: getListSubjectsQueryKey({}) } });

  const filtered = subjects?.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase());
    const matchGrade = gradeFilter === "all" || s.gradeLevel === Number(gradeFilter);
    return matchSearch && matchGrade;
  }) ?? [];

  const grades = [...new Set(subjects?.map(s => s.gradeLevel) ?? [])].sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Matières</h1>
        <p className="text-muted-foreground">Naviguez dans le contenu pédagogique</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher une matière..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-subjects" />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-40" data-testid="select-grade"><SelectValue placeholder="Toutes les classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les classes</SelectItem>
            {grades.map(g => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Aucune matière trouvée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((subject, i) => (
            <motion.div key={subject.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link href={`/student/subjects/${subject.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-all hover:border-primary/40 group" data-testid={`subject-card-${subject.id}`}>
                  <CardContent className="pt-5 pb-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{subject.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{subject.code}</p>
                        {subject.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{subject.description}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant="outline" className="text-xs">Grade {subject.gradeLevel}</Badge>
                      <Badge variant="secondary" className="text-xs">{subject.lessonCount} leçons</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
