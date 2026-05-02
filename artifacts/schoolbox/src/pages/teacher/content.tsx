import { useRef, useState } from "react";
import {
  useListSubjects,
  getListSubjectsQueryKey,
  useListLessons,
  getListLessonsQueryKey,
  useCreateLesson,
} from "@workspace/api-client-react";

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
import { useUpload } from "@workspace/object-storage-web";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Plus,
  FileText,
  Video,
  Headphones,
  ChevronDown,
  ChevronRight,
  Clock,
  Upload,
  Download,
  Paperclip,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const fileTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  video: Video,
  audio: Headphones,
  html: FileText,
};

const fileTypeColors: Record<string, string> = {
  pdf: "bg-red-100 text-red-700",
  video: "bg-blue-100 text-blue-700",
  audio: "bg-purple-100 text-purple-700",
  html: "bg-gray-100 text-gray-700",
};

const ALLOWED_TYPES: Record<string, string[]> = {
  pdf: ["application/pdf"],
  video: ["video/mp4", "video/webm", "video/ogg", "video/*"],
  audio: ["audio/mpeg", "audio/ogg", "audio/wav", "audio/*"],
  html: ["text/html", "text/plain", "application/zip"],
};

function FileUploadButton({ lesson, onDone }: { lesson: Lesson; onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadFile, isUploading, progress } = useUpload({
    basePath: `${BASE}/api/storage`,
    onSuccess: async (response) => {
      try {
        await fetch(`${BASE}/api/lessons/${lesson.id}/file`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileUrl: `${BASE}/api/storage${response.objectPath}`,
            fileName: response.metadata.name,
          }),
        });
        toast({ title: "File uploaded successfully" });
        onDone();
      } catch {
        toast({ title: "Failed to save file reference", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Upload failed", variant: "destructive" });
    },
  });

  const accept = lesson.fileType ? ALLOWED_TYPES[lesson.fileType]?.join(",") ?? "*" : "*";

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
          e.target.value = "";
        }}
      />
      {isUploading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="shrink-0">Uploading…</span>
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="shrink-0">{progress}%</span>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3 w-3" />
          {lesson.fileUrl ? "Replace file" : "Attach file"}
        </Button>
      )}
    </div>
  );
}

function LessonList({ subjectId }: { subjectId: number }) {
  const queryClient = useQueryClient();
  const { data: lessons, isLoading } = useListLessons(subjectId, {
    query: { queryKey: getListLessonsQueryKey(subjectId) },
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey(subjectId) });
  };

  if (isLoading) return <Skeleton className="h-16 rounded-lg" />;
  if (!lessons?.length) {
    return (
      <p className="text-sm text-muted-foreground py-3 text-center italic">
        No lessons yet — add the first one.
      </p>
    );
  }

  return (
    <div className="space-y-2 mt-2">
      {lessons.map((lesson: Lesson) => {
        const Icon = fileTypeIcons[lesson.fileType ?? "html"] ?? FileText;
        return (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-2 p-3 rounded-lg bg-white border border-border"
          >
            <div className="flex items-start gap-3">
              <span className={`p-1.5 rounded text-xs font-medium shrink-0 ${fileTypeColors[lesson.fileType ?? "html"]}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{lesson.title}</p>
                {lesson.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{lesson.description}</p>
                )}
                {lesson.fileName && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Paperclip className="h-3 w-3 shrink-0" />
                    <span className="truncate">{lesson.fileName}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {lesson.durationMinutes && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {lesson.durationMinutes}m
                  </span>
                )}
                {lesson.fileUrl && (
                  <a
                    href={lesson.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Download className="h-3 w-3" />
                    Open
                  </a>
                )}
              </div>
            </div>
            <div className="pl-8">
              <FileUploadButton lesson={lesson} onDone={refetch} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function AddLessonDialog({ subjectId, subjectName }: { subjectId: number; subjectName: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [fileType, setFileType] = useState<"pdf" | "video" | "audio" | "html">("html");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createLesson = useCreateLesson();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createLesson.mutateAsync({
        id: subjectId,
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          durationMinutes: duration ? Number(duration) : undefined,
          fileType,
          orderIndex: 0,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey(subjectId) });
      queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey({}) });
      toast({ title: "Lesson added — you can now attach a file to it" });
      setTitle("");
      setDescription("");
      setDuration("");
      setFileType("html");
      setOpen(false);
    } catch {
      toast({ title: "Failed to add lesson", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Lesson
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Lesson to {subjectName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="lesson-title">Title *</Label>
            <Input
              id="lesson-title"
              placeholder="e.g. Introduction to Algebra"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lesson-desc">Description</Label>
            <Textarea
              id="lesson-desc"
              placeholder="What will students learn in this lesson?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Content Type</Label>
              <Select value={fileType} onValueChange={v => setFileType(v as typeof fileType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="html">Notes / HTML</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lesson-duration">Duration (min)</Label>
              <Input
                id="lesson-duration"
                type="number"
                placeholder="45"
                min={1}
                max={300}
                value={duration}
                onChange={e => setDuration(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Upload className="h-3 w-3" />
            After creating, you can attach a file directly on the lesson card.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!title.trim() || createLesson.isPending}>
              {createLesson.isPending ? "Adding…" : "Add Lesson"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TeacherContent() {
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const { data: subjects, isLoading } = useListSubjects({}, {
    query: { queryKey: getListSubjectsQueryKey({}) },
  });

  const filtered = subjects?.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const totalLessons = subjects?.reduce((acc, s) => acc + (s.lessonCount ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Library</h1>
          <p className="text-muted-foreground mt-1">Add lessons and attach files — students can download them instantly</p>
        </div>
        <div className="flex gap-3">
          <Card className="text-center px-4 py-2 border-primary/20">
            <p className="text-xs text-muted-foreground">Subjects</p>
            <p className="text-xl font-bold text-primary">{subjects?.length ?? 0}</p>
          </Card>
          <Card className="text-center px-4 py-2 border-primary/20">
            <p className="text-xs text-muted-foreground">Total Lessons</p>
            <p className="text-xl font-bold text-primary">{totalLessons}</p>
          </Card>
        </div>
      </div>

      <div className="relative">
        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search subjects…"
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No subjects found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(subject => {
            const isExpanded = expandedSubject === subject.id;
            return (
              <Card key={subject.id} className="overflow-hidden">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <button
                      className="flex-1 flex items-center gap-3 text-left"
                      onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                    >
                      <span className="text-muted-foreground">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{subject.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">{subject.code}</Badge>
                          <Badge variant="secondary" className="text-xs">Grade {subject.gradeLevel}</Badge>
                        </div>
                        {subject.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subject.description}</p>
                        )}
                      </div>
                      <Badge className="shrink-0">{subject.lessonCount} lesson{subject.lessonCount !== 1 ? "s" : ""}</Badge>
                    </button>
                    <AddLessonDialog subjectId={subject.id} subjectName={subject.name} />
                  </div>
                </CardHeader>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="lessons"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <CardContent className="pt-0 pb-4 px-4 bg-muted/30">
                        <LessonList subjectId={subject.id} />
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
