/* global process */
export function CreditsBanner() {
  if (process.env.NODE_ENV !== 'production') return null;

  return (
    <div className="credits-banner">
      <img
        src="https://docs.elfhosted.com/images/logo.svg"
        alt="ElfHosted"
        className="credits-banner-logo"
      />
      <span className="credits-banner-subtitle">
        This public instance of TMDB Discover+ is sponsored by{' '}
        <a href="https://elfhosted.com" target="_blank" rel="noreferrer">
          ElfHosted
        </a>{' '}
        ❤️
      </span>
    </div>
  );
}
