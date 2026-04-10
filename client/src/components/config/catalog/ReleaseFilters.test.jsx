import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReleaseFilters } from './ReleaseFilters';

describe('ReleaseFilters', () => {
  const baseProps = {
    localCatalog: { type: 'series', filters: {} },
    onFiltersChange: vi.fn(),
    isMovie: false,
    countries: [],
    releaseTypes: [],
    tvStatuses: [
      { value: '0', label: 'Returning Series' },
      { value: '3', label: 'Ended' },
    ],
    tvTypes: [
      { value: '4', label: 'Scripted' },
      { value: '3', label: 'Reality' },
    ],
    certOptions: [],
    certCountries: [],
  };

  it('renders only one Any option for show status and show type dropdowns', () => {
    render(<ReleaseFilters {...baseProps} />);

    fireEvent.click(screen.getByRole('combobox', { name: /show status/i }));
    let listbox = screen.getByRole('listbox');
    expect(within(listbox).getAllByText('Any')).toHaveLength(1);
    fireEvent.mouseDown(document.body);

    fireEvent.click(screen.getByRole('combobox', { name: /show type/i }));
    listbox = screen.getByRole('listbox');
    expect(within(listbox).getAllByText('Any')).toHaveLength(1);
  });

  it('updates first-air-year max when current year changes', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-04-09T12:00:00Z'));
      const { rerender } = render(<ReleaseFilters {...baseProps} />);

      expect(screen.getByPlaceholderText('e.g. 2019')).toHaveAttribute('max', '2027');

      vi.setSystemTime(new Date('2027-01-15T12:00:00Z'));
      rerender(
        <ReleaseFilters
          {...baseProps}
          localCatalog={{
            type: 'series',
            filters: { ...baseProps.localCatalog.filters, tvStatus: '0' },
          }}
        />
      );

      expect(screen.getByPlaceholderText('e.g. 2019')).toHaveAttribute('max', '2028');
    } finally {
      vi.useRealTimers();
    }
  });
});
