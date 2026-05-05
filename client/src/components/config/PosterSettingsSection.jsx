import { useState } from 'react';
import { ChevronDown, Image, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { useCatalog } from '../../context/AppContext';

export function PosterSettingsSection() {
  const { preferences, setPreferences: onPreferencesChange } = useCatalog();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const posterService = preferences?.posterService || 'none';
  const hasPosterKey = Boolean(preferences?.posterApiKeyEncrypted);
  const posterCustomUrlPattern = preferences?.posterCustomUrlPattern || '';
  const isCustomPosterService = posterService === 'customUrl';

  const handleServiceChange = (e) => {
    const newService = e.target.value;
    onPreferencesChange({
      ...preferences,
      posterService: newService,
      ...(newService === 'none' && {
        posterApiKey: undefined,
        posterApiKeyEncrypted: undefined,
      }),
    });
    setApiKeyInput('');
  };

  const handleApiKeyChange = (e) => {
    const newKey = e.target.value;
    setApiKeyInput(newKey);
    if (newKey) {
      onPreferencesChange({
        ...preferences,
        posterApiKey: newKey,
      });
    }
  };

  const handleCustomPatternChange = (e) => {
    onPreferencesChange({
      ...preferences,
      posterCustomUrlPattern: e.target.value,
    });
  };

  const serviceUrl =
    posterService === 'rpdb'
      ? 'https://ratingposterdb.com'
      : posterService === 'topPosters'
        ? 'https://api.top-streaming.stream'
        : null;

  const serviceName =
    posterService === 'rpdb' ? 'RPDB' : posterService === 'topPosters' ? 'Top Posters' : null;

  return (
    <div className="sidebar-section poster-settings">
      <div
        className="sidebar-section-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsCollapsed(!isCollapsed);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <Image size={14} className="text-muted" />
        <span className="sidebar-section-title">Poster Support</span>
        <ChevronDown
          size={14}
          className={`text-muted poster-settings-chevron${isCollapsed ? ' collapsed' : ''}`}
        />
      </div>

      {!isCollapsed && (
        <div className="poster-settings-body">
          <div className="input-group poster-settings-service-group">
            <label htmlFor="poster-service" className="poster-settings-label">
              Poster Service
            </label>
            <select
              id="poster-service"
              className="input poster-settings-select"
              value={posterService}
              onChange={handleServiceChange}
            >
              <option value="none">Default (TMDB)</option>
              <option value="rpdb">RPDB (Rating Posters)</option>
              <option value="topPosters">Top Posters</option>
              <option value="customUrl">Custom URL Pattern</option>
            </select>
          </div>

          {posterService !== 'none' && (
            <div className="input-group">
              <label htmlFor="poster-api-key" className="poster-settings-label">
                {isCustomPosterService ? 'API Key (optional)' : 'API Key'}{' '}
                {hasPosterKey && !apiKeyInput && (
                  <span className="poster-settings-status">(set)</span>
                )}
              </label>
              <div className="poster-settings-input-wrapper">
                <input
                  id="poster-api-key"
                  type={showApiKey ? 'text' : 'password'}
                  className="input poster-settings-input"
                  placeholder={
                    hasPosterKey
                      ? '••••••••'
                      : isCustomPosterService
                        ? 'Optional (for {api_key} placeholder)'
                        : 'Enter API key'
                  }
                  value={apiKeyInput}
                  onChange={handleApiKeyChange}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="poster-settings-toggle-visibility"
                  title={showApiKey ? 'Hide' : 'Show'}
                >
                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {serviceUrl && serviceName ? (
                <p className="poster-settings-hint">
                  Get key from{' '}
                  <a
                    href={serviceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="poster-settings-link"
                  >
                    {serviceName} <ExternalLink size={10} className="poster-settings-link-icon" />
                  </a>
                </p>
              ) : null}

              {isCustomPosterService && (
                <>
                  <label htmlFor="poster-custom-pattern" className="poster-settings-label">
                    Custom URL Pattern
                  </label>
                  <input
                    id="poster-custom-pattern"
                    type="text"
                    className="input poster-settings-input"
                    placeholder="https://example.com/{type}/{rating_id}.jpg"
                    value={posterCustomUrlPattern}
                    onChange={handleCustomPatternChange}
                  />
                  <p className="poster-settings-hint">
                    Placeholders: {'{type}'}, {'{imdb_id}'}, {'{tmdb_id}'}, {'{rating_id}'},{' '}
                    {'{rating_id_type}'}, {'{api_key}'}, {'{api_key_urlencoded}'}, {'{language}'},{' '}
                    {'{language_short}'}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
