import { useState } from "react";
import {
  useListUsers,
  useDeactivateUser,
  useCreateUser,
  useListClasses,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  MoreHorizontal,
  UserX,
  CheckCircle2,
  Users,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Eye,
  EyeOff,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";

import { useTranslation } from "react-i18next";

const roleConfig = {
  admin: { key: "admin", icon: ShieldCheck, color: "bg-violet-100 text-violet-700 border-violet-200" },
  teacher: { key: "teacher", icon: BookOpen, color: "bg-blue-100 text-blue-700 border-blue-200" },
  student: { key: "student", icon: GraduationCap, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

type Role = "admin" | "teacher" | "student";

const emptyForm = {
  fullName: "",
  username: "",
  password: "",
  role: "student" as Role,
  classId: "",
};

export default function UserManagement() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showPwd, setShowPwd] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useListUsers(undefined, {
    query: { queryKey: getListUsersQueryKey() },
  });
  const { data: classes } = useListClasses();
  const deactivateUser = useDeactivateUser();
  const createUser = useCreateUser({
    mutation: {
      onSuccess: (u) => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setOpen(false);
        setForm(emptyForm);
        toast({ title: t("accountCreated"), description: `"${u.fullName}" (${u.username})` });
      },
      onError: () => toast({ title: t("error"), description: t("errorCreatingAccount"), variant: "destructive" }),
    },
  });

  const handleDeactivate = async (id: number, name: string) => {
    try {
      await deactivateUser.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: t("accountDeactivated"), description: `"${name}"` });
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.username || !form.password || !form.role) return;
    createUser.mutate({
      data: {
        fullName: form.fullName.trim(),
        username: form.username.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        classId: form.classId ? Number(form.classId) : null,
      },
    });
  };

  const filtered = (users ?? []).filter(u => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const counts = { admin: 0, teacher: 0, student: 0 };
  (users ?? []).forEach(u => { if (u.role in counts) counts[u.role as Role]++; });

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("usersTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t("usersSubtitle")}</p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)} data-testid="button-create-user">
          <Plus className="h-4 w-4" />
          {t("newUser")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.entries(roleConfig) as [Role, typeof roleConfig.admin][]).map(([role, cfg], i) => (
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-white p-4 flex items-center gap-3 cursor-pointer transition-all"
            onClick={() => setRoleFilter(roleFilter === role ? "all" : role)}
            style={{ outline: roleFilter === role ? "2px solid hsl(var(--primary))" : "none", outlineOffset: 2 }}
          >
            <div className={`p-2.5 rounded-xl border ${cfg.color} shrink-0`}>
              <cfg.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-black leading-none">{counts[role]}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t(cfg.key)}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute inline-start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            className="ps-9 rounded-xl text-start"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40 rounded-xl">
            <Users className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder={t("allRoles")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allRoles")}</SelectItem>
            <SelectItem value="admin">{t("admin")}</SelectItem>
            <SelectItem value="teacher">{t("teacher")}</SelectItem>
            <SelectItem value="student">{t("student")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border border-border shadow-none">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="overflow-x-auto text-start">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("fullName")}</th>
                    <th className="px-5 py-3.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("username")}</th>
                    <th className="px-5 py-3.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("role")}</th>
                    <th className="px-5 py-3.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("status")}</th>
                    <th className="px-5 py-3.5 text-inline-end text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                        {t("noUsersFound")}
                      </td>
                    </tr>
                  )}
                  {filtered.map(user => {
                    const role = user.role as Role;
                    const cfg = roleConfig[role] ?? roleConfig.student;
                    const initials = user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${cfg.color}`}>
                              {initials}
                            </div>
                            <span className="font-medium">{user.fullName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{user.username}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
                            <cfg.icon className="h-3 w-3" />
                            {t(cfg.key)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {user.isActive ? (
                            <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {t("active")}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                              <UserX className="w-3.5 h-3.5" /> {t("inactive")}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-inline-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-user-actions-${user.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 focus:bg-red-50 gap-2"
                                onClick={() => handleDeactivate(user.id, user.fullName)}
                                disabled={!user.isActive || deactivateUser.isPending}
                              >
                                <UserX className="h-3.5 w-3.5" />
                                {t("deactivate")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE dialog */}
      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setForm(emptyForm); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              {t("createUser")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-semibold">{t("fullName")} *</Label>
              <Input
                id="fullName"
                placeholder={t("fullNamePlaceholder")}
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold">{t("username")} *</Label>
              <Input
                id="username"
                placeholder={t("usernamePlaceholder")}
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "") }))}
                className="font-mono"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold">{t("password")} *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder={t("passwordMin")}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="pr-10"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPwd(v => !v)}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("role")} *</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(roleConfig) as [Role, typeof roleConfig.admin][]).map(([role, cfg]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role, classId: "" }))}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-semibold ${
                      form.role === role
                        ? `border-primary ${cfg.color}`
                        : "border-border bg-muted/20 text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <cfg.icon className="h-4 w-4" />
                    {t(cfg.key)}
                  </button>
                ))}
              </div>
            </div>
            {form.role === "student" && classes && classes.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t("assignedClass")}</Label>
                <Select value={form.classId} onValueChange={v => setForm(f => ({ ...f, classId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("chooseClass")} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} — {t("grade")} {c.gradeLevel} ({c.academicYear})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={!form.fullName || !form.username || !form.password || createUser.isPending}
              >
                {createUser.isPending
                  ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <CheckCircle2 className="h-4 w-4" />
                }
                {createUser.isPending ? t("loading") : t("createUser")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
