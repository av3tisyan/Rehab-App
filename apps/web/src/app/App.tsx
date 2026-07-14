import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
import { AppLayout } from './AppLayout';
import { useAuthStore } from '../lib/auth-store';
import { LoginPage } from '../features/auth/LoginPage';
import { PatientsPage } from '../features/patients/PatientsPage';
import { PatientDetailPage } from '../features/patients/PatientDetailPage';
import { EpisodeDetailPage } from '../features/episodes/EpisodeDetailPage';
import { AssessmentPage } from '../features/assessment/AssessmentPage';
import { AuditTrailPage } from '../features/audit/AuditTrailPage';

/** Renders children only for admins; others are redirected. */
function RequireAdmin({ children }: { children: ReactNode }) {
  const role = useAuthStore((s) => s.user?.role);
  return role === 'admin' ? <>{children}</> : <Navigate to="/patients" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/patients" replace />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/patients/:patientId" element={<PatientDetailPage />} />
        <Route path="/episodes/:episodeId" element={<EpisodeDetailPage />} />
        <Route
          path="/episodes/:episodeId/assessment/:encounterId"
          element={<AssessmentPage />}
        />
        <Route
          path="/audit"
          element={
            <RequireAdmin>
              <AuditTrailPage />
            </RequireAdmin>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/patients" replace />} />
    </Routes>
  );
}
