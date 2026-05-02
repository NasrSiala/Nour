import { useGetLesson, useGetSubject, getGetLessonQueryKey, getGetSubjectQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import { ArrowLeft, Clock, FileText, Video, Globe, Music } from "lucide-react";
import { motion } from "framer-motion";

const fileTypeConfig = {
  pdf: { icon: FileText, label: "Document PDF", color: "text-red-500", bg: "bg-red-50" },
  video: { icon: Video, label: "Vidéo", color: "text-blue-500", bg: "bg-blue-50" },
  html: { icon: Globe, label: "Contenu interactif", color: "text-green-500", bg: "bg-green-50" },
  audio: { icon: Music, label: "Enregistrement audio", color: "text-purple-500", bg: "bg-purple-50" },
};

export default function LessonDetail() {
  const { id } = useParams<{ id: string }>();
  const lessonId = Number(id);

  const { data: lesson, isLoading } = useGetLesson(lessonId, { query: { queryKey: getGetLessonQueryKey(lessonId) } });

  const { data: subject } = useGetSubject(
    lesson?.subjectId ?? 0,
    { query: { enabled: !!lesson?.subjectId, queryKey: getGetSubjectQueryKey(lesson?.subjectId ?? 0) } }
  );

  const ftCfg = lesson?.fileType ? fileTypeConfig[lesson.fileType as keyof typeof fileTypeConfig] : null;
  const Icon = ftCfg?.icon ?? FileText;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={subject ? `/student/subjects/${lesson?.subjectId}` : "/student/subjects"}>
          <Button variant="ghost" size="icon" className="shrink-0" data-testid="button-back-lesson">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0">
          {isLoading ? <Skeleton className="h-7 w-64" /> : (
            <>
              <p className="text-xs text-muted-foreground">{subject?.name} · Leçon {lesson?.orderIndex}</p>
              <h1 className="text-xl font-bold tracking-tight leading-tight truncate">{lesson?.title}</h1>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : (
        <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className={`p-5 rounded-2xl ${ftCfg?.bg ?? "bg-muted"}`}>
                  <Icon className={`h-10 w-10 ${ftCfg?.color ?? "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="font-semibold text-lg">{lesson?.title}</p>
                  {ftCfg && <Badge variant="secondary" className="mt-1">{ftCfg.label}</Badge>}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {lesson?.durationMinutes && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {lesson.durationMinutes} minutes
                    </span>
                  )}
                </div>
                <Button className="mt-2 gap-2" data-testid="button-open-lesson">
                  <Icon className="h-4 w-4" />
                  Ouvrir le contenu
                </Button>
              </div>
            </CardContent>
          </Card>

          {lesson?.description && (
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm font-medium mb-1.5">Description</p>
                <p className="text-sm text-muted-foreground">{lesson.description}</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
