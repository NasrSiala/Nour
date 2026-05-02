import { useGetSubject, useListLessons, getGetSubjectQueryKey, getListLessonsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import { ArrowLeft, Clock, FileText, Video, Globe, Music, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const fileTypeConfig = {
  pdf: { icon: FileText, label: "PDF", color: "text-red-500 bg-red-50" },
  video: { icon: Video, label: "Vidéo", color: "text-blue-500 bg-blue-50" },
  html: { icon: Globe, label: "Interactif", color: "text-green-500 bg-green-50" },
  audio: { icon: Music, label: "Audio", color: "text-purple-500 bg-purple-50" },
};

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const subjectId = Number(id);

  const { data: subject, isLoading: loadingSubject } = useGetSubject(
    subjectId,
    { query: { queryKey: getGetSubjectQueryKey(subjectId) } }
  );

  const { data: lessons, isLoading: loadingLessons } = useListLessons(
    subjectId,
    { query: { queryKey: getListLessonsQueryKey(subjectId) } }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/student/subjects">
          <Button variant="ghost" size="icon" className="shrink-0" data-testid="button-back-subjects">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          {loadingSubject ? <Skeleton className="h-7 w-48" /> : (
            <>
              <h1 className="text-2xl font-bold tracking-tight">{subject?.name}</h1>
              <p className="text-muted-foreground text-sm">{subject?.code} · Grade {subject?.gradeLevel}</p>
            </>
          )}
        </div>
      </div>

      {subject?.description && (
        <Card>
          <CardContent className="pt-4 pb-4 text-sm text-muted-foreground">{subject.description}</CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Leçons ({lessons?.length ?? 0})</h2>
        </div>
        {loadingLessons ? (
          <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : lessons?.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Aucune leçon disponible</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {lessons?.map((lesson, i) => {
              const ftCfg = lesson.fileType ? fileTypeConfig[lesson.fileType as keyof typeof fileTypeConfig] : null;
              const Icon = ftCfg?.icon ?? FileText;
              return (
                <motion.div key={lesson.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={`/student/lessons/${lesson.id}`}>
                    <Card className="cursor-pointer hover:shadow-sm hover:border-primary/40 transition-all group" data-testid={`lesson-card-${lesson.id}`}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${ftCfg?.color ?? "text-muted-foreground bg-muted"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{lesson.title}</p>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />{lesson.durationMinutes ?? "—"} min
                              </span>
                              {ftCfg && <Badge variant="secondary" className="text-xs py-0">{ftCfg.label}</Badge>}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
