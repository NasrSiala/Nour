import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

import Login from "@/pages/login";
import Signup from "@/pages/signup";
import NotFound from "@/pages/not-found";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminUsers from "@/pages/admin/users";
import AdminClasses from "@/pages/admin/classes";
import AdminNotifications from "@/pages/admin/notifications";
import { AdminLayout } from "@/components/layout/admin-layout";

import TeacherDashboard from "@/pages/teacher/index";
import TeacherAttendance from "@/pages/teacher/attendance";
import TeacherRisk from "@/pages/teacher/risk";
import TeacherClasses from "@/pages/teacher/classes";
import TeacherContent from "@/pages/teacher/content";
import { TeacherLayout } from "@/components/layout/teacher-layout";

import StudentDashboard from "@/pages/student/index";
import StudentSubjects from "@/pages/student/subjects";
import SubjectDetail from "@/pages/student/subject-detail";
import LessonDetail from "@/pages/student/lesson-detail";
import StudentAttendance from "@/pages/student/attendance";
import { StudentLayout } from "@/components/layout/student-layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function ProtectedRoute({
  component: Component,
  layout: Layout,
  allowedRoles,
}: {
  component: React.ComponentType;
  layout?: React.ComponentType<{ children: React.ReactNode }>;
  allowedRoles?: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Redirect to="/" />;

  if (Layout) {
    return <Layout><Component /></Layout>;
  }
  return <Component />;
}

function HomeRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;
  switch (user.role) {
    case "admin": return <Redirect to="/admin" />;
    case "teacher": return <Redirect to="/teacher" />;
    case "student": return <Redirect to="/student" />;
    default: return <Redirect to="/login" />;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/" component={HomeRedirect} />

      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} layout={AdminLayout} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/analytics">
        <ProtectedRoute component={AdminAnalytics} layout={AdminLayout} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute component={AdminUsers} layout={AdminLayout} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/classes">
        <ProtectedRoute component={AdminClasses} layout={AdminLayout} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/notifications">
        <ProtectedRoute component={AdminNotifications} layout={AdminLayout} allowedRoles={["admin"]} />
      </Route>

      <Route path="/teacher">
        <ProtectedRoute component={TeacherDashboard} layout={TeacherLayout} allowedRoles={["teacher"]} />
      </Route>
      <Route path="/teacher/attendance">
        <ProtectedRoute component={TeacherAttendance} layout={TeacherLayout} allowedRoles={["teacher"]} />
      </Route>
      <Route path="/teacher/risk">
        <ProtectedRoute component={TeacherRisk} layout={TeacherLayout} allowedRoles={["teacher"]} />
      </Route>
      <Route path="/teacher/classes">
        <ProtectedRoute component={TeacherClasses} layout={TeacherLayout} allowedRoles={["teacher"]} />
      </Route>
      <Route path="/teacher/content">
        <ProtectedRoute component={TeacherContent} layout={TeacherLayout} allowedRoles={["teacher"]} />
      </Route>

      <Route path="/student">
        <ProtectedRoute component={StudentDashboard} layout={StudentLayout} allowedRoles={["student"]} />
      </Route>
      <Route path="/student/subjects">
        <ProtectedRoute component={StudentSubjects} layout={StudentLayout} allowedRoles={["student"]} />
      </Route>
      <Route path="/student/subjects/:id">
        <ProtectedRoute component={SubjectDetail} layout={StudentLayout} allowedRoles={["student"]} />
      </Route>
      <Route path="/student/lessons/:id">
        <ProtectedRoute component={LessonDetail} layout={StudentLayout} allowedRoles={["student"]} />
      </Route>
      <Route path="/student/attendance">
        <ProtectedRoute component={StudentAttendance} layout={StudentLayout} allowedRoles={["student"]} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
