import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { AuthProvider, useAuth } from "./auth";
import { ToastProvider } from "./components/Toast";
import ErrorBoundary from "./components/ErrorBoundary";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import { PageLoadingSkeleton } from "./components/PageLoading";
import DemoBanner from "./components/DemoBanner";

const StudentList = lazy(() => import("./components/StudentList"));
const SessionList = lazy(() => import("./components/SessionList"));
const SessionDetail = lazy(() => import("./components/SessionDetail"));
const ClassList = lazy(() => import("./components/ClassList"));
const ClassDetail = lazy(() => import("./components/ClassDetail"));
const NewSession = lazy(() => import("./components/NewSession"));
const NewClass = lazy(() => import("./components/NewClass"));
const AdminPage = lazy(() => import("./components/AdminPage"));
const StudentProfile = lazy(() => import("./components/StudentProfile"));
const StudentDashboard = lazy(() => import("./components/StudentDashboard"));
const InstructorDashboard = lazy(() => import("./components/InstructorDashboard"));
const ProfilePage = lazy(() => import("./components/ProfilePage"));
const ActivityPage = lazy(() => import("./components/ActivityPage"));
const SupportPage = lazy(() => import("./components/SupportPage"));

function LazyFallback() {
  return <PageLoadingSkeleton />;
}

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="app app-loading-shell">
        <PageLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="app">
      <DemoBanner />
      <div className="shell">
        <Sidebar />
        <div className="main">
          <Suspense fallback={<LazyFallback />}>
            <Outlet />
          </Suspense>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}

function DefaultRedirect() {
  return <Navigate to="/dashboard" replace />;
}

function Dashboard() {
  const { isInstructor } = useAuth();
  return isInstructor ? <InstructorDashboard /> : <StudentDashboard />;
}

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <Routes>
          <Route element={<ProtectedLayout />}>
            <Route index element={<DefaultRedirect />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="students" element={<StudentList />} />
            <Route path="students/:studentId" element={<StudentProfile />} />
            <Route path="students/:studentId/sessions" element={<SessionList />} />
            <Route path="students/:studentId/sessions/new" element={<NewSession />} />
            <Route path="sessions" element={<SessionList />} />
            <Route path="sessions/:id" element={<SessionDetail />} />
            <Route path="classes" element={<ClassList />} />
            <Route path="classes/new" element={<NewClass />} />
            <Route path="classes/:id" element={<ClassDetail />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="*" element={<DefaultRedirect />} />
          </Route>
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
