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
});
