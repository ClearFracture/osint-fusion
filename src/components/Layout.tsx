import { Link, Outlet } from 'react-router-dom';
import { BootstrapNotice } from './BootstrapNotice';
import { useAwsCredentials } from '../contexts/AwsCredentialsContext';

export function Layout() {
  const { identityArn, logout } = useAwsCredentials();

  return (
    <div className="min-h-screen bg-tactical-bg text-tactical-text font-body">
      <header className="border-b border-tactical-border bg-tactical-panel/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Link to="/" className="font-display text-2xl font-bold tracking-wide text-tactical-gold">
              OSINT-FUSION
            </Link>
            <p className="text-sm text-tactical-muted">Collection request & data cube operations</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {identityArn && (
              <span className="hidden max-w-xs truncate text-tactical-muted md:inline" title={identityArn}>
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
