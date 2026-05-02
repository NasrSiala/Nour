import { useGetSubject, useListLessons, getGetSubjectQueryKey, getListLessonsQueryKey } from "@workspace/api-client-react";

type Lesson = {
  id: number;
  subjectId: number;
  title: string;
  description?: string | null;
  fileType?: string | null;
  durationMinutes?: number | null;
  orderIndex?: number | null;
  fileUrl?: string | null;
  fileName?: string | null;
};
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import { ArrowLeft, Clock, FileText, Video, Globe, Music, ChevronRight, Download, Paperclip, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const fileTypeConfig = {
  pdf: { icon: FileText, label: "PDF", iconBg: "bg-red-100", iconText: "text-red-600", badge: "text-red-700 bg-red-50 border-red-200" },
  video: { icon: Video, label: "Vidéo", iconBg: "bg-blue-100", iconText: "text-blue-600", badge: "text-blue-700 bg-blue-50 border-blue-200" },
  html: { icon: Globe, label: "Interactif", iconBg: "bg-emerald-100", iconText: "text-emerald-600", badge: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  audio: { icon: Music, label: "Audio", iconBg: "bg-purple-100", iconText: "text-purple-600", badge: "text-purple-700 bg-purple-50 border-purple-200" },
};

const subjectGradients = [
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-sky-600",
];

function LessonRow({ lesson, index }: { lesson: Lesson; index: number }) {
  const ftCfg = lesson.fileType ? fileTypeConfig[lesson.fileType as keyof typeof fileTypeConfig] : null;
  const Icon = ftCfg?.icon ?? BookOpen;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/student/lessons/${lesson.id}`}>
        <div className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
          {/* Order number */}
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
            <span className="text-xs font-bold text-muted-foreground group-hover:text-primary">{index + 1}</span>
          </div>

          {/* Type icon */}
          <div className={`p-2 rounded-xl shrink-0 ${ftCfg?.iconBg ?? "bg-muted"}`}>
            <Icon className={`h-4 w-4 ${ftCfg?.iconText ?? "text-muted-foreground"}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{lesson.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {ftCfg && (
                <Badge variant="outline" className={`text-xs py-0 ${ftCfg.badge}`}>{ftCfg.label}</Badge>
              )}
              {lesson.durationMinutes && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />{lesson.durationMinutes} min
                </span>
              )}
              {lesson.fileUrl && (
                <span className="flex items-center gap-1 text-xs text-primary font-medium">
                  <Paperclip className="h-3 w-3" />Fichier joint
                </span>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {lesson.fileUrl && (
              <a
                href={lesson.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </a>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const subjectId = Number(id);

  const { data: subject, isLoading: loadingSubject } = useGetSubject(subjectId, {
    query: { queryKey: getGetSubjectQueryKey(subjectId) },
  });

  const { data: lessons, isLoading: loadingLessons } = useListLessons(subjectId, {
    query: { queryKey: getListLessonsQueryKey(subjectId) },
  });

  const gradient = subjectGradients[subjectId % subjectGradients.length];
  const withFile = lessons?.filter(l => l.fileUrl).length ?? 0;

  return (
    <div className="space-y-5 pb-8">
      {/* Back */}
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
        <Link href="/student/subjects">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Toutes les matières
          </Button>
        </Link>
      </motion.div>

      {/* Subject hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-7 text-white shadow-xl`}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative">
          {loadingSubject ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 bg-white/20" />
              <Skeleton className="h-4 w-32 bg-white/20" />
            </div>
          ) : (
            <>
              <p className="text-white/70 text-sm font-medium mb-1">{subject?.code}</p>
              <h1 className="text-3xl font-bold tracking-tight">{subject?.name}</h1>
              {subject?.description && (
                <p className="text-white/80 text-sm mt-2 max-w-lg leading-relaxed">{subject.description}</p>
              )}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <span className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-sm font-medium border border-white/20">
                  <BookOpen className="h-3.5 w-3.5" />
                  {lessons?.length ?? 0} leçons
                </span>
                {withFile > 0 && (
                  <span className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-sm font-medium border border-white/20">
                    <Download className="h-3.5 w-3.5" />
                    {withFile} fichier{withFile > 1 ? "s" : ""} disponible{withFile > 1 ? "s" : ""}
                  </span>
                )}
                <Badge className="bg-white/20 border border-white/20 text-white">
                  Grade {subject?.gradeLevel}
                </Badge>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Lessons list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Leçons du programme
          </h2>
          {!loadingLessons && lessons && (
            <Badge variant="secondary" className="text-xs">{lessons.length} au total</Badge>
          )}
        </div>

        {loadingLessons ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : lessons?.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-muted/30">
            <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">Aucune leçon disponible</p>
            <p className="text-xs text-muted-foreground mt-1">Revenez bientôt</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lessons?.map((lesson, i) => (
              <LessonRow key={lesson.id} lesson={lesson} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
