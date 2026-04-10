import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogSidebar } from './CatalogSidebar';

const mockUseCatalog = vi.fn();
const mockUseTMDBData = vi.fn();
const mockUseAppActions = vi.fn();

vi.mock('../../hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('../../context/AppContext', () => ({
  useCatalog: () => mockUseCatalog(),
  useTMDBData: () => mockUseTMDBData(),
  useAppActions: () => mockUseAppActions(),
}));

vi.mock('./GeneralSettingsSection', () => ({
  GeneralSettingsSection: () => <div data-testid="general-settings-section" />,
}));

vi.mock('./PosterSettingsSection', () => ({
  PosterSettingsSection: () => <div data-testid="poster-settings-section" />,
}));

describe('CatalogSidebar search toggles', () => {
  const setPreferences = vi.fn();

  const getBaseCatalogState = () => ({
    catalogs: [],
    activeCatalog: null,
    setActiveCatalog: vi.fn(),
    globalSource: 'tmdb',
    setGlobalSource: vi.fn(),
    configName: '',
    setConfigName: vi.fn(),
    preferences: {
      disableSearch: false,
      disableTmdbSearch: false,
      disableImdbSearch: true,
      disableAnilistSearch: true,
      disableMalSearch: true,
      disableSimklSearch: true,
      disableTraktSearch: true,
    },
    setPreferences,
    handleAddPresetCatalog: vi.fn(),
    handleDeleteCatalog: vi.fn(),
    handleDuplicateCatalog: vi.fn(),
    handleImportConfig: vi.fn(),
    setCatalogs: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseCatalog.mockReturnValue(getBaseCatalogState());

    mockUseTMDBData.mockReturnValue({
      presetCatalogs: { movie: [], series: [] },
      imdbPresetCatalogs: [],
      imdbEnabled: false,
    });

    mockUseAppActions.mockReturnValue({
      addToast: vi.fn(),
      setShowNewCatalogModal: vi.fn(),
    });
  });

  it('shows Trakt capability toggle and updates preference', () => {
    // In the new logic, Trakt is disabled by default (disableTraktSearch: true).
    // Clicking the "Trakt" pill should enable it (disableTraktSearch: false).
    const baseState = getBaseCatalogState();
    // Start with explicitly true (disabled)
    mockUseCatalog.mockReturnValue({
      ...baseState,
      preferences: {
        ...baseState.preferences,
        disableTraktSearch: true,
      },
    });

    render(<CatalogSidebar />);

    fireEvent.click(screen.getByRole('button', { name: /settings/i }));

    const traktToggle = screen.getByRole('button', { name: 'Trakt' });
    expect(traktToggle).toBeInTheDocument();

    fireEvent.click(traktToggle);

    expect(setPreferences).toHaveBeenCalledWith(
      expect.objectContaining({ disableTraktSearch: false })
    );
  });

  it('hides source-specific toggles when Disable Search is enabled', () => {
    const baseState = getBaseCatalogState();
    mockUseCatalog.mockReturnValue({
      ...baseState,
      preferences: {
        disableSearch: true,
      },
    });

    render(<CatalogSidebar />);

    fireEvent.click(screen.getByRole('button', { name: /settings/i }));

    expect(screen.queryByRole('button', { name: 'Trakt' })).not.toBeInTheDocument();
  });
});
