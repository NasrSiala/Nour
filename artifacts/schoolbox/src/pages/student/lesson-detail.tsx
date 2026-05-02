import { useGetLesson, useGetSubject, getGetLessonQueryKey, getGetSubjectQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import { ArrowLeft, Clock, FileText, Video, Globe, Music, Download, ExternalLink, Paperclip, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const fileTypeConfig = {
  pdf: {
    icon: FileText,
    label: "Document PDF",
    gradient: "from-red-500 to-rose-600",
    softBg: "bg-red-50",
    softText: "text-red-600",
    border: "border-red-200",
    glow: "shadow-red-100",
  },
  video: {
    icon: Video,
    label: "Vidéo",
    gradient: "from-blue-500 to-indigo-600",
    softBg: "bg-blue-50",
    softText: "text-blue-600",
    border: "border-blue-200",
    glow: "shadow-blue-100",
  },
  html: {
    icon: Globe,
    label: "Contenu interactif",
    gradient: "from-emerald-500 to-teal-600",
    softBg: "bg-emerald-50",
    softText: "text-emerald-600",
    border: "border-emerald-200",
    glow: "shadow-emerald-100",
  },
  audio: {
    icon: Music,
    label: "Enregistrement audio",
    gradient: "from-purple-500 to-violet-600",
    softBg: "bg-purple-50",
    softText: "text-purple-600",
    border: "border-purple-200",
    glow: "shadow-purple-100",
  },
};

const defaultConfig = {
  icon: BookOpen,
  label: "Leçon",
  gradient: "from-slate-500 to-slate-600",
  softBg: "bg-slate-50",
  softText: "text-slate-600",
  border: "border-slate-200",
  glow: "shadow-slate-100",
};

export default function LessonDetail() {
  const { id } = useParams<{ id: string }>();
  const lessonId = Number(id);

  const { data: lesson, isLoading } = useGetLesson(lessonId, {
    query: { queryKey: getGetLessonQueryKey(lessonId) },
  });

  const { data: subject } = useGetSubject(lesson?.subjectId ?? 0, {
    query: { enabled: !!lesson?.subjectId, queryKey: getGetSubjectQueryKey(lesson?.subjectId ?? 0) },
  });

  const cfg = lesson?.fileType
    ? fileTypeConfig[lesson.fileType as keyof typeof fileTypeConfig] ?? defaultConfig
    : defaultConfig;
  const Icon = cfg.icon;

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-72 rounded-3xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Breadcrumb back bar */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2"
      >
        <Link href={subject ? `/student/subjects/${lesson?.subjectId}` : "/student/subjects"}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
            <ArrowLeft className="h-4 w-4" />
            {subject?.name ?? "Retour"}
          </Button>
        </Link>
      </motion.div>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${cfg.gradient} p-8 text-white shadow-xl ${cfg.glow}`}
      >
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col items-center text-center gap-5">
          {/* Icon bubble */}
          <div className="p-5 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
            <Icon className="h-12 w-12 text-white" />
          </div>

          {/* Breadcrumb badge */}
          <Badge className="bg-white/20 border border-white/30 text-white hover:bg-white/30 text-xs">
            {subject?.name ?? "Matière"} · {cfg.label}
          </Badge>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold leading-tight tracking-tight">{lesson?.title}</h1>
            {lesson?.description && (
              <p className="text-white/80 text-sm max-w-md leading-relaxed">{lesson.description}</p>
            )}
          </div>

          {/* Meta chips */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {lesson?.durationMinutes && (
              <span className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-sm font-medium border border-white/20">
                <Clock className="h-3.5 w-3.5" />
                {lesson.durationMinutes} min
              </span>
            )}
            {lesson?.fileName && (
              <span className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-sm font-medium border border-white/20 max-w-[200px]">
                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{lesson.fileName}</span>
              </span>
            )}
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3 flex-wrap justify-center pt-1">
            {lesson?.fileUrl ? (
              <>
                <a href={lesson.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="lg"
                    className="bg-white text-gray-900 hover:bg-white/90 gap-2 font-semibold shadow-lg"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger le fichier
                  </Button>
                </a>
                <a href={lesson.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/40 text-white hover:bg-white/15 gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir
                  </Button>
                </a>
              </>
            ) : (
              <Button
                size="lg"
                className="bg-white text-gray-900 hover:bg-white/90 gap-2 font-semibold shadow-lg opacity-60 cursor-not-allowed"
                disabled
              >
                <Icon className="h-4 w-4" />
                Aucun fichier joint
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Info card if file is attached */}
      {lesson?.fileUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`flex items-center gap-4 p-4 rounded-2xl border ${cfg.border} ${cfg.softBg}`}
        >
          <div className={`p-2 rounded-xl ${cfg.softBg}`}>
            <Paperclip className={`h-5 w-5 ${cfg.softText}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${cfg.softText}`}>Fichier joint disponible</p>
            <p className="text-xs text-muted-foreground truncate">{lesson.fileName ?? "Fichier de cours"}</p>
          </div>
          <a href={lesson.fileUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className={`gap-1.5 ${cfg.softText} ${cfg.border}`}>
              <Download className="h-3.5 w-3.5" />
              Télécharger
            </Button>
          </a>
        </motion.div>
      )}

      {/* Lesson order context */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{lesson?.orderIndex ?? 1}</span>
          </div>
          <div>
            <p className="text-sm font-medium">Leçon {lesson?.orderIndex}</p>
            <p className="text-xs text-muted-foreground">{subject?.name}</p>
          </div>
        </div>
        <Link href={`/student/subjects/${lesson?.subjectId}`}>
          <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground">
            Voir toutes les leçons
            <ArrowLeft className="h-3 w-3 rotate-180" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
