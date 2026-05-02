import { useState } from "react";
import { useListClasses, useGetClassRiskScores, useAcknowledgeRiskAlert, useListRiskAlerts, getListClassesQueryKey, getGetClassRiskScoresQueryKey, getListRiskAlertsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const tierConfig = {
  low: { label: "Faible", cls: "bg-green-100 text-green-800 border-green-200" },
  medium: { label: "Moyen", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  high: { label: "Élevé", cls: "bg-orange-100 text-orange-800 border-orange-200" },
  critical: { label: "Critique", cls: "bg-red-100 text-red-800 border-red-200" },
};

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-red-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-green-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.8 ? "bg-red-500" : score >= 0.6 ? "bg-orange-500" : score >= 0.3 ? "bg-amber-400" : "bg-green-500";
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function RiskPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [filterTier, setFilterTier] = useState<string>("all");

  const { data: classes } = useListClasses({ query: { queryKey: getListClassesQueryKey() } });
  const myClasses = classes?.filter(c => c.homeroomTeacherId === user?.id) ?? [];

  const { data: riskScores, isLoading: loadingScores } = useGetClassRiskScores(
    selectedClassId ?? 0,
    { query: { enabled: !!selectedClassId, queryKey: getGetClassRiskScoresQueryKey(selectedClassId ?? 0) } }
  );

  const { data: alerts } = useListRiskAlerts(
    { acknowledged: false },
    { query: { queryKey: getListRiskAlertsQueryKey({ acknowledged: false }) } }
  );

  const acknowledgeAlert = useAcknowledgeRiskAlert();

  const handleAcknowledge = async (alertId: number) => {
    try {
      await acknowledgeAlert.mutateAsync({ id: alertId });
      queryClient.invalidateQueries({ queryKey: getListRiskAlertsQueryKey() });
      toast({ title: "Alerte acquittée" });
    } catch {
      toast({ title: "Erreur lors de l'acquittement", variant: "destructive" });
    }
  };

  const filtered = riskScores?.filter(s => filterTier === "all" || s.tier === filterTier) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau des risques</h1>
        <p className="text-muted-foreground">Risques de décrochage scolaire par classe</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select onValueChange={v => setSelectedClassId(Number(v))}>
          <SelectTrigger className="w-44" data-testid="select-class-risk">
            <SelectValue placeholder="Choisir une classe" />
          </SelectTrigger>
          <SelectContent>
            {myClasses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-36" data-testid="select-tier-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les niveaux</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
            <SelectItem value="high">Élevé</SelectItem>
            <SelectItem value="medium">Moyen</SelectItem>
            <SelectItem value="low">Faible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {alerts && alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              {alerts.length} alerte{alerts.length > 1 ? "s" : ""} non acquittée{alerts.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="flex items-center justify-between bg-white rounded-lg border border-orange-200 p-3">
                <div>
                  <p className="text-sm font-medium">{alert.studentName}</p>
                  <p className="text-xs text-muted-foreground">{alert.className} · {alert.alertType}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleAcknowledge(alert.id)} disabled={acknowledgeAlert.isPending}
                  className="gap-1 text-xs" data-testid={`button-acknowledge-${alert.id}`}>
                  <CheckCircle2 className="h-3 w-3" /> Acquitter
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!selectedClassId ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Sélectionnez une classe pour afficher les scores de risque
          </CardContent>
        </Card>
      ) : loadingScores ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Aucun élève trouvé pour ce filtre</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((score, i) => {
            const cfg = tierConfig[score.tier as keyof typeof tierConfig] ?? tierConfig.medium;
            return (
              <motion.div key={score.studentId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className={cn("border-l-4", score.tier === "critical" ? "border-l-red-500" : score.tier === "high" ? "border-l-orange-500" : score.tier === "medium" ? "border-l-amber-400" : "border-l-green-500")}
                  data-testid={`risk-card-${score.studentId}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{score.studentName}</p>
                          <TrendIcon trend={score.trend} />
                        </div>
                        <ScoreBar score={score.score} />
                        <div className="flex flex-wrap gap-x-4 mt-2 text-xs text-muted-foreground">
                          <span>{score.consecutiveAbsences} abs. consécutives</span>
                          <span>{Math.round((score.absenceRate30d ?? 0) * 100)}% absence/30j</span>
                        </div>
                        {score.explanation?.[0] && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{score.explanation[0]}</p>
                        )}
                      </div>
                      <Badge className={cn("border shrink-0", cfg.cls)}>{cfg.label}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
