import { Navigate, Outlet, NavLink } from "react-router-dom";

export default function MainLayout() {
  if (!sessionStorage.getItem("careerpath.studentToken")) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-vh-100">
      <header className="student-topbar">
        <NavLink className="student-brand" to="/dashboard">CareerPath <span>Student workspace</span></NavLink>
      </header>
      <main className="student-main">
        <Outlet />
      </main>
    </div>
  );
}