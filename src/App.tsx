import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CredentialGate } from './components/CredentialGate';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AwsCredentialsProvider } from './contexts/AwsCredentialsContext';
import { BootstrapProvider } from './contexts/BootstrapContext';
import { BelvedereHandoffPage } from './pages/BelvedereHandoffPage';
import { LandingPage } from './pages/LandingPage';
import { NewRequestPage } from './pages/NewRequestPage';
import { RequestDetailPage } from './pages/RequestDetailPage';

export default function App() {
  return (
    <AwsCredentialsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/credentials" element={<CredentialGate />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<BootstrapProvider><Layout /></BootstrapProvider>}>
              <Route index element={<LandingPage />} />
              <Route path="requests/new" element={<NewRequestPage />} />
              <Route path="requests/:requestId" element={<RequestDetailPage />} />
              <Route path="requests/:requestId/handoff" element={<BelvedereHandoffPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AwsCredentialsProvider>
  );
}
