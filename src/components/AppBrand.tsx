import { Link } from 'react-router-dom';

interface AppBrandProps {
  subtitle?: string;
  linkToHome?: boolean;
  logoClassName?: string;
}

/** Application logo and title for headers. */
export function AppBrand({
  subtitle = 'Collection request & data cube operations',
  linkToHome = true,
  logoClassName = 'h-14 w-14 shrink-0 object-contain',
}: AppBrandProps) {
  const brand = (
    <div className="flex items-center gap-3">
      <img
        src="/osint-fusion-logo.png"
        alt="OSINT-Fusion shield logo"
        className={logoClassName}
      />
      <div>
        <p className="font-display text-2xl font-bold leading-tight tracking-wide text-tactical-gold">
          OSINT-FUSION
        </p>
        {subtitle && <p className="text-sm text-tactical-muted">{subtitle}</p>}
      </div>
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="transition-opacity hover:opacity-90">
        {brand}
      </Link>
    );
  }

  return brand;
}
