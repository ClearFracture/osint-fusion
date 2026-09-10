import { Outlet } from 'react-router-dom';
import { AppBrand } from './AppBrand';
import { BootstrapNotice } from './BootstrapNotice';
import { useAwsCredentials } from '../contexts/AwsCredentialsContext';

export function Layout() {
  const { identityArn, credentialsFromEnv, logout } = useAwsCredentials();

  return (
    <div className="min-h-screen bg-tactical-bg text-tactical-text font-body">
      <header className="border-b border-tactical-border bg-tactical-panel/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <AppBrand />
          <div className="flex items-center gap-4 text-sm">
            {identityArn && (
              <span className="hidden max-w-xs truncate text-tactical-muted md:inline" title={identityArn}>
                {credentialsFromEnv ? 'Env credentials · ' : ''}
                {identityArn}
              </span>
            )}
            <button
              type="button"
              onClick={logout}
              className="rounded border border-tactical-border px-3 py-1 hover:border-tactical-gold hover:text-tactical-gold"
            >
              Clear credentials
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <BootstrapNotice />
        <Outlet />
      </main>
    </div>
  );
}
