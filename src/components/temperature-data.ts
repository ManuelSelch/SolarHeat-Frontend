export type TemperatureRange = 'day' | 'month' | 'year';

type TemperatureAverage = {
  avg_solar: string | number;
  avg_pump: string | number;
  avg_security: string | number;
  avg_rel: string | number;
} & ({ date: string } | { month: string });

export type TemperatureHistory = Temperature | TemperatureAverage;

export type TemperatureChartPoint = {
  date: string;
  solar: number;
  pump: number;
  security: number;
};

export function formatChartLabel(date: string, range: TemperatureRange): string {
  if (range === 'month') return `${date.slice(8, 10)}.`;
  if (range === 'year') return ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][Number(date.slice(5, 7)) - 1];
  const time = new Date(date);
  return `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
}

export function dateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function localDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function periodKey(date: string, range: TemperatureRange): string {
  return date.slice(0, range === 'day' ? 10 : range === 'month' ? 7 : 4);
}

export function shiftPeriod(date: string, range: TemperatureRange, direction: number): string {
  const next = localDate(date);
  if (range === 'day') next.setDate(next.getDate() + direction);
  if (range === 'month') {
    next.setDate(1);
    next.setMonth(next.getMonth() + direction);
  }
  if (range === 'year') {
    next.setMonth(0, 1);
    next.setFullYear(next.getFullYear() + direction);
  }
  return dateInputValue(next);
}

export function parsePeriodInput(value: string, range: TemperatureRange, today: string): string | null {
  const pattern = range === 'day' ? /^\d{4}-\d{2}-\d{2}$/ : range === 'month' ? /^\d{4}-\d{2}$/ : /^\d{4}$/;
  if (!pattern.test(value)) return null;
  const date = range === 'day' ? value : range === 'month' ? `${value}-01` : `${value}-01-01`;
  if (dateInputValue(localDate(date)) !== date || Number(date.slice(0, 4)) < 1000) return null;
  return periodKey(date, range) <= periodKey(today, range) ? date : null;
}

export function formatPeriodTitle(date: string, range: TemperatureRange): string {
  if (range === 'year') return `Jahr ${date.slice(0, 4)}`;
  return localDate(date).toLocaleDateString('de-DE', range === 'day'
    ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    : { month: 'long', year: 'numeric' });
}

// Do not relabel today's data as history while an old backend ignores `date`.
export function chartPointsForPeriod(data: TemperatureChartPoint[], range: TemperatureRange, date: string): TemperatureChartPoint[] {
  return data.filter((point) => {
    const pointDate = range === 'day' ? dateInputValue(new Date(point.date)) : point.date;
    return periodKey(pointDate, range) === periodKey(date, range);
  });
}

// The API returns raw readings for a day, daily averages for a month,
// and monthly averages for a year. SQL averages arrive as decimal strings.
export function normalizeChartData(data: TemperatureHistory[]): TemperatureChartPoint[] {
  return data.map((item) => {
    if ('timestamp' in item) {
      return { date: item.timestamp, solar: item.solar, pump: item.pump, security: item.security };
    }
    return {
      date: 'date' in item ? item.date : item.month,
      solar: Number(item.avg_solar),
      pump: Number(item.avg_pump),
      security: Number(item.avg_security),
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
}
