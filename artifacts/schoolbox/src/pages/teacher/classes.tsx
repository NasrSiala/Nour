import { useState } from "react";
import { useListClasses, useGetClassStudents, getListClassesQueryKey, getGetClassStudentsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TeacherClasses() {
  const { user } = useAuth();
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null);

  const { data: classes, isLoading } = useListClasses({ query: { queryKey: getListClassesQueryKey() } });
  const myClasses = classes?.filter(c => c.homeroomTeacherId === user?.id) ?? [];

  const { data: students, isLoading: loadingStudents } = useGetClassStudents(
    expandedClassId ?? 0,
    { query: { enabled: !!expandedClassId, queryKey: getGetClassStudentsQueryKey(expandedClassId ?? 0) } }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes classes</h1>
        <p className="text-muted-foreground">{myClasses.length} classe{myClasses.length !== 1 ? "s" : ""} assignée{myClasses.length !== 1 ? "s" : ""}</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : myClasses.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune classe assignée</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {myClasses.map((cls, i) => (
            <motion.div key={cls.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card>
                <CardHeader
                  className="cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg"
                  onClick={() => setExpandedClassId(expandedClassId === cls.id ? null : cls.id)}
                  data-testid={`class-header-${cls.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{cls.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">Grade {cls.gradeLevel} · Année {cls.academicYear}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{cls.studentCount} élèves</Badge>
                      {expandedClassId === cls.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>
                <AnimatePresence>
                  {expandedClassId === cls.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                      <CardContent className="pt-0">
                        <div className="border-t pt-4">
                          {loadingStudents ? (
                            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {students?.map(student => (
                                <div key={student.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50" data-testid={`student-item-${student.id}`}>
                                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                    {student.firstName[0]}{student.lastName[0]}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{student.firstName} {student.lastName}</p>
                                    <p className="text-xs text-muted-foreground">{student.gender === "male" ? "M" : "F"}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
