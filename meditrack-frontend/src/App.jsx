import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientDashboard, { PatientSidebar } from './pages/patient/Dashboard';
import SymptomsPage from './pages/patient/SymptomsPage';
import AppointmentsPage from './pages/patient/AppointmentsPage';
import DoctorDashboard, { DoctorSidebar } from './pages/doctor/DoctorDashboard';
import AdminDashboard, { AdminSidebar } from './pages/admin/AdminDashboard';

function PortalLayout({ Sidebar }) {
  return (
    <>
      <Navbar />
      <div className="dashboard-layout">
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<><Navbar /><LoginPage /></>} />
          <Route path="/register" element={<><Navbar /><RegisterPage /></>} />

          {/* Patient Portal */}
          <Route path="/patient" element={
            <ProtectedRoute roles={['patient']}>
              <PortalLayout Sidebar={PatientSidebar} />
            </ProtectedRoute>
          }>
            <Route index element={<PatientDashboard />} />
            <Route path="symptoms" element={<SymptomsPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
          </Route>

          {/* Doctor Portal */}
          <Route path="/doctor" element={
            <ProtectedRoute roles={['doctor']}>
              <PortalLayout Sidebar={DoctorSidebar} />
            </ProtectedRoute>
          }>
            <Route index element={<DoctorDashboard />} />
          </Route>

          {/* Admin Portal */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <PortalLayout Sidebar={AdminSidebar} />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
