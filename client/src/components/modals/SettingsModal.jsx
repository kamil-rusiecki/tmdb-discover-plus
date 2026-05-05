import {
  Download,
  Upload,
  EyeOff,
  Settings,
  X,
  KeyRound,
  Image as ImageIcon,
  Globe,
  Database,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { useState } from 'react';
import { useModalA11y } from '../../hooks/useModalA11y';
import { useCatalog, useAppActions, useTMDBData } from '../../context/AppContext';
import { SearchableSelect } from '../forms/SearchableSelect';

export function SettingsModal({ isOpen, onClose, onShowExport, onImportData }) {
  const modalRef = useModalA11y(isOpen, onClose);
  const { preferences, setPreferences: onPreferencesChange } = useCatalog();
  const { languages = [] } = useTMDBData();
  const { addToast, handleLogout } = useAppActions();

  // Poster state
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  if (!isOpen) return null;

  const defaultLanguage = preferences?.defaultLanguage || '';

  // Poster handlers
  const posterService = preferences?.posterService || 'none';
  const hasPosterKey = Boolean(preferences?.posterApiKeyEncrypted);

  const handleLanguageChange = (val) => {
    onPreferencesChange({ ...preferences, defaultLanguage: val });
  };

  const handlePosterServiceChange = (e) => {
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

  const handlePosterApiKeyChange = (e) => {
    const newKey = e.target.value;
    setApiKeyInput(newKey);
    if (newKey) onPreferencesChange({ ...preferences, posterApiKey: newKey });
  };

  const posterServiceUrl =
    posterService === 'rpdb'
      ? 'https://ratingposterdb.com'
      : posterService === 'topPosters'
        ? 'https://api.top-streaming.stream'
        : null;
  const posterServiceName =
    posterService === 'rpdb' ? 'RPDB' : posterService === 'topPosters' ? 'Top Posters' : null;

  return (
    <div className="modal-overlay">
      <div
        className="modal settings-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Global Settings"
      >
        <div className="settings-modal-header">
          <div className="settings-modal-title-group">
            <Settings size={22} className="text-secondary" />
            <h2 className="modal-title m-0" style={{ fontSize: '1.15rem', fontWeight: '600' }}>
              Global Settings
            </h2>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="settings-modal-body">
          <div className="settings-section">
            <div className="settings-section-header">
              <Database size={16} />
              <h3>Data Management</h3>
            </div>
            <div className="settings-action-grid">
              <button
                className="btn settings-action-card"
                onClick={() => {
                  onShowExport(true);
                  onClose();
                }}
              >
                <div className="sac-icon">
                  <Upload size={18} />
                </div>
                <div className="sac-text">
                  <span className="sac-title">Export Config</span>
                  <span className="sac-desc">Save catalogs to a file</span>
                </div>
              </button>

              <label className="btn settings-action-card">
                <div className="sac-icon">
                  <Download size={18} />
                </div>
                <div className="sac-text">
                  <span className="sac-title">Import Config</span>
                  <span className="sac-desc">Load from a file</span>
                </div>
                <input
                  type="file"
                  accept=".json"
                  className="hidden-file-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const imported = JSON.parse(event.target.result);
                        if (
                          imported?.catalogs?.length ||
                          imported?.preferences ||
                          imported?.configName
                        ) {
                          onImportData(imported);
                          onClose();
                        } else {
                          if (addToast) addToast('No valid data found', 'error');
                        }
                      } catch {
                        if (addToast) addToast('Failed to parse file', 'error');
                      }
                      e.target.value = '';
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-header">
              <Globe size={16} />
              <h3>General Preferences</h3>
            </div>

            <div className="settings-card">
              <div className="settings-row">
                <div className="settings-row-info">
                  <span className="settings-label">Language</span>
                  <span className="settings-desc">Global display & trailer language</span>
                </div>
                <div className="settings-row-control">
                  <div style={{ minWidth: '280px' }}>
                    <SearchableSelect
                      options={languages}
                      value={defaultLanguage}
                      onChange={handleLanguageChange}
                      placeholder="Auto / English"
                      valueKey="iso_639_1"
                      labelKey="english_name"
                      aria-label="Global Language"
                      renderOption={(opt) => `${opt.english_name} (${opt.name})`}
                    />
                  </div>
                </div>
              </div>

              <div
                className="settings-row clickable-row"
                role="button"
                tabIndex={0}
                onClick={() =>
                  onPreferencesChange({
                    ...preferences,
                    shuffleCatalogs: !preferences?.shuffleCatalogs,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPreferencesChange({
                      ...preferences,
                      shuffleCatalogs: !preferences?.shuffleCatalogs,
                    });
                  }
                }}
              >
                <div className="settings-row-info">
                  <span className="settings-label">Shuffle Catalogs</span>
                  <span className="settings-desc">Randomize the order when Stremio loads</span>
                </div>
                <div className="settings-row-control align-right">
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={!!preferences?.shuffleCatalogs}
                      onChange={(e) =>
                        onPreferencesChange({ ...preferences, shuffleCatalogs: e.target.checked })
                      }
                      className="toggle-checkbox"
                    />
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </div>

              <div className="settings-row">
                <div className="settings-row-info">
                  <span className="settings-label">TMDB API Key</span>
                  <span className="settings-desc">Update your personal TMDB access key</span>
                </div>
                <div className="settings-row-control align-right">
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px' }}
                    onClick={() => handleLogout({ changeKey: true })}
                  >
                    <KeyRound size={14} />
                    Change Key
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-header">
              <Settings size={16} />
              <h3>Search Integrations</h3>
            </div>

            <div className="settings-card">
              <div
                className="settings-row clickable-row"
                style={{ paddingBottom: '16px', borderBottom: 'none' }}
                role="button"
                tabIndex={0}
                onClick={() =>
                  onPreferencesChange({
                    ...preferences,
                    disableSearch: !preferences?.disableSearch,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPreferencesChange({
                      ...preferences,
                      disableSearch: !preferences?.disableSearch,
                    });
                  }
                }}
              >
                <div className="settings-row-info">
                  <span className="settings-label">Disable All Search</span>
                  <span className="settings-desc">
                    Turn off search integration across all networks
                  </span>
                </div>
                <div className="settings-row-control align-right">
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={!!preferences?.disableSearch}
                      onChange={(e) =>
                        onPreferencesChange({ ...preferences, disableSearch: e.target.checked })
                      }
                      className="toggle-checkbox"
                    />
                    <div className="toggle-slider toggle-negative"></div>
                  </div>
                </div>
              </div>

              {!preferences?.disableSearch && (
                <>
                  <div
                    style={{
                      padding: '0 16px 12px',
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Select providers to add them to your Stremio search results.
                  </div>
                  <div className="settings-provider-grid">
                    {[
                      { id: 'TMDB', pref: 'disableTmdbSearch', defaultActive: true },
                      { id: 'IMDb', pref: 'disableImdbSearch', defaultActive: true },
                      { id: 'AniList', pref: 'disableAnilistSearch', defaultActive: true },
                      { id: 'MAL', pref: 'disableMalSearch', defaultActive: true },
                      { id: 'Kitsu', pref: 'disableKitsuSearch', defaultActive: true },
                      { id: 'Simkl', pref: 'disableSimklSearch', defaultActive: true },
                      { id: 'Trakt', pref: 'disableTraktSearch', defaultActive: true },
                    ].map((p) => {
                      const isActive = p.defaultActive
                        ? preferences?.[p.pref] !== true
                        : preferences?.[p.pref] === false;
                      const handleToggle = () =>
                        onPreferencesChange({ ...preferences, [p.pref]: isActive });

                      return (
                        <button
                          key={p.id}
                          className={`settings-provider-btn ${isActive ? 'active' : ''} ${p.id.toLowerCase()}-btn`}
                          onClick={handleToggle}
                        >
                          {p.id}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-header">
              <ImageIcon size={16} />
              <h3>Poster Support</h3>
            </div>

            <div className="settings-card">
              <div
                className="settings-row"
                style={{ alignItems: 'flex-start', flexDirection: 'column' }}
              >
                <div className="settings-row-info" style={{ marginTop: '4px', width: '100%' }}>
                  <span className="settings-label">Poster Service</span>
                  <span className="settings-desc" style={{ marginBottom: '12px' }}>
                    Source high quality overlay posters
                  </span>
                </div>
                <div className="flex-col" style={{ width: '100%', gap: '10px' }}>
                  <SearchableSelect
                    options={[
                      { id: 'none', name: 'Default (TMDB)' },
                      { id: 'rpdb', name: 'RPDB (Rating Posters)' },
                      { id: 'topPosters', name: 'Top Posters' },
                    ]}
                    value={posterService}
                    onChange={(val) => handlePosterServiceChange({ target: { value: val } })}
                    valueKey="id"
                    labelKey="name"
                    placeholder="Select a service"
                    menuPlacement="top"
                  />

                  {posterService !== 'none' && (
                    <div className="poster-key-box animate-fade-in" style={{ marginTop: '4px' }}>
                      <div className="input-group m-0" style={{ margin: 0 }}>
                        <label
                          className="text-xs text-muted font-medium"
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                          }}
                        >
                          API Key
                          {hasPosterKey && !apiKeyInput && (
                            <span className="text-primary">Saved ✓</span>
                          )}
                        </label>
                        <div
                          style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                        >
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            className="input w-full"
                            placeholder={hasPosterKey ? '••••••••' : 'Enter API key'}
                            value={apiKeyInput}
                            onChange={handlePosterApiKeyChange}
                            style={{ paddingRight: '40px' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="btn-icon"
                            style={{
                              position: 'absolute',
                              right: '4px',
                              background: 'transparent',
                            }}
                            title={showApiKey ? 'Hide' : 'Show'}
                          >
                            {showApiKey ? (
                              <EyeOff size={16} className="text-muted" />
                            ) : (
                              <Eye size={16} className="text-muted" />
                            )}
                          </button>
                        </div>
                        <p
                          style={{
                            fontSize: '11.5px',
                            marginTop: '10px',
                            color: 'var(--text-muted)',
                          }}
                        >
                          Get your key from{' '}
                          <a
                            href={posterServiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {posterServiceName} <ExternalLink size={10} />
                          </a>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
