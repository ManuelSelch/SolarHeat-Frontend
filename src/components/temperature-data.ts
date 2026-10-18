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
  if (range !== 'day') return date;
  const time = new Date(date);
  return `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
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
