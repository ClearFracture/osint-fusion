import { Navigate, Outlet } from 'react-router-dom';
import { useAwsCredentials } from '../contexts/AwsCredentialsContext';

export function ProtectedRoute() {
  const { credentials } = useAwsCredentials();
  if (!credentials) {
    return <Navigate to="/credentials" replace />;
  }
  return <Outlet />;
}
