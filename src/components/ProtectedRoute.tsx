import { Navigate, Outlet } from 'react-router-dom';
import { useAwsCredentials } from '../contexts/AwsCredentialsContext';

export function ProtectedRoute() {
  const { authStatus } = useAwsCredentials();

  if (authStatus === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-tactical-bg font-body text-tactical-muted">
        Verifying AWS credentials…
      </div>
    );
  }

  if (authStatus !== 'authenticated') {
    return <Navigate to="/credentials" replace />;
  }

  return <Outlet />;
}
