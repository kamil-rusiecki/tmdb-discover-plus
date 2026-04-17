export function CreditsBanner({ addonVariant = null }) {
  if (addonVariant === null || addonVariant === 'nightly') return null;

  return (
    <div className="credits-banner">
      <img
        src="https://docs.elfhosted.com/images/logo.svg"
        alt="ElfHosted"
        className="credits-banner-logo"
      />
      <div className="credits-banner-content">
        <p>
          This is the public instance of TMDB Discover+, sponsored by{' '}
          <span className="nowrap">
            <a href="https://store.elfhosted.com/" target="_blank" rel="noreferrer">
              ElfHosted
            </a>{' '}
            ❤️
          </span>
        </p>
        <p>
          See our FREE{' '}
          <span className="nowrap">
            <a href="https://stremio-addons-guide.elfhosted.com" target="_blank" rel="noreferrer">
              Stremio Addons Guide
            </a>
          </span>{' '}
          for more great addons and features!
        </p>
      </div>
    </div>
  );
}
