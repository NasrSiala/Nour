import { useState } from "react";
import {
  useListClasses,
  useCreateClass,
  getListClassesQueryKey,
  useListUsers,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Users, GraduationCap, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface ClassFormData { name: string; gradeLevel: number; academicYear: string; }

export default function AdminClasses() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [teacherId, setTeacherId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: classes, isLoading } = useListClasses({ query: { queryKey: getListClassesQueryKey() } });
  const { data: teachers } = useListUsers(
    { role: "teacher" },
    { query: { queryKey: [...getListUsersQueryKey({ role: "teacher" })] } }
  );
  const createClass = useCreateClass();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClassFormData>({
    defaultValues: { name: "", gradeLevel: 3, academicYear: "2025-2026" }
  });

  const onSubmit = async (data: ClassFormData) => {
    try {
      await createClass.mutateAsync({
        data: {
          ...data,
          gradeLevel: Number(data.gradeLevel),
          homeroomTeacherId: teacherId && teacherId !== "none" ? Number(teacherId) : null,
        }
      });
      queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
      toast({ title: t("classCreated") });
      reset();
      setTeacherId("");
      setOpen(false);
    } catch {
      toast({ title: t("errorCreatingClass"), variant: "destructive" });
    }
  };

  const byGrade = classes?.reduce((acc, cls) => {
    const g = cls.gradeLevel;
    if (!acc[g]) acc[g] = [];
    acc[g].push(cls);
    return acc;
  }, {} as Record<number, typeof classes>) ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-start">
          <h1 className="text-2xl font-bold tracking-tight">{t("classesTitle")}</h1>
          <p className="text-muted-foreground">{classes?.length ?? 0} {t("totalClasses")}</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2" data-testid="button-create-class">
          <Plus className="h-4 w-4" /> {t("newClass")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      ) : (
        Object.entries(byGrade).sort(([a], [b]) => Number(a) - Number(b)).map(([grade, gradeClasses]) => (
          <div key={grade} className="text-start">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">{t("grade")} {grade}</h2>
              <Badge variant="secondary" className="text-xs">{gradeClasses.length} {t("class")}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gradeClasses.map((cls, i) => (
                <motion.div key={cls.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card data-testid={`class-card-${cls.id}`}>
                    <CardContent className="pt-5 pb-5">
                      <div className="flex items-start justify-between">
                        <div className="text-start">
                          <p className="font-semibold">{cls.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{cls.academicYear}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-4 text-sm">
                        <span className="font-bold text-lg">{cls.studentCount}</span>
                        <span className="text-muted-foreground text-xs">{t("studentCount")}</span>
                      </div>
                      {cls.teacherName ? (
                        <div className="flex items-center gap-1.5 mt-2">
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <p className="text-xs text-emerald-700 font-medium truncate">{cls.teacherName}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/60 mt-2 italic">{t("noTeacher")}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { reset(); setTeacherId(""); } }}>
        <DialogContent>
          <DialogHeader className="text-start">
            <DialogTitle>{t("createClass")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5 text-start">
              <Label>{t("className")}</Label>
              <Input {...register("name", { required: true })} placeholder={t("classNamePlaceholder")} data-testid="input-class-name" />
              {errors.name && <p className="text-xs text-destructive">{t("required")}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 text-start">
              <div className="space-y-1.5">
                <Label>{t("gradeLevel")}</Label>
                <Input type="number" {...register("gradeLevel", { required: true, min: 1, max: 12 })} placeholder={t("gradePlaceholder")} data-testid="input-grade-level" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("academicYear")}</Label>
                <Input {...register("academicYear", { required: true })} placeholder={t("yearPlaceholder")} data-testid="input-academic-year" />
              </div>
            </div>
            <div className="space-y-1.5 text-start">
              <Label className="flex items-center gap-1.5 text-xs font-semibold">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                {t("homeroomTeacher")}
                <span className="text-muted-foreground font-normal">({t("optional")})</span>
              </Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("chooseTeacher")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("noTeacherSelected")}</SelectItem>
                  {(teachers ?? []).map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
              <Button type="submit" disabled={createClass.isPending} data-testid="button-submit-class">
                {createClass.isPending ? t("loading") : t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
