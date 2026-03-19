export const DATE_PRESETS = [
  { label: 'Last 30 days', value: 'last_30_days', group: 'last' },
  { label: 'Last 90 days', value: 'last_90_days', group: 'last' },
  { label: 'Last 6 months', value: 'last_180_days', group: 'last' },
  { label: 'Last 12 months', value: 'last_365_days', group: 'last' },
  { label: 'Next 30 days', value: 'next_30_days', group: 'next' },
  { label: 'Next 3 months', value: 'next_90_days', group: 'next' },
  { label: '2020s', value: 'era_2020s', group: 'decade' },
  { label: '2010s', value: 'era_2010s', group: 'decade' },
  { label: '2000s', value: 'era_2000s', group: 'decade' },
  { label: '1990s', value: 'era_1990s', group: 'decade' },
  { label: '1980s', value: 'era_1980s', group: 'decade' },
];

export const PRESET_DATE_MAP = {
  last_30_days: { from: 'today-30d', to: 'today' },
  last_90_days: { from: 'today-90d', to: 'today' },
  last_180_days: { from: 'today-6mo', to: 'today' },
  last_365_days: { from: 'today-12mo', to: 'today' },
  next_30_days: { from: 'today', to: 'today+30d' },
  next_90_days: { from: 'today', to: 'today+3mo' },
  era_2020s: { from: '2020-01-01', to: '2030-01-01' },
  era_2010s: { from: '2010-01-01', to: '2020-01-01' },
  era_2000s: { from: '2000-01-01', to: '2010-01-01' },
  era_1990s: { from: '1990-01-01', to: '2000-01-01' },
  era_1980s: { from: '1980-01-01', to: '1990-01-01' },
};
