import axios from 'axios';
import type { TemperatureHistory, TemperatureRange } from './temperature-data';

const backend = 'https://solar-heat.manuelselch.de';

export async function getHistory(range: TemperatureRange, date: string, signal?: AbortSignal): Promise<TemperatureHistory[]> {
  const response = await axios.get<TemperatureHistory[]>(`${backend}/temperatures`, {
    params: { range, date },
    signal,
  });
  return response.data;
}

export async function getLive(date: string, signal?: AbortSignal): Promise<{ temperature: Temperature | null; status: Status }> {
  const [readings, status] = await Promise.all([
    getHistory('day', date, signal),
    axios.get<Status>(`${backend}/temperatures/status`, { signal }),
  ]);
  let temperature: Temperature | null = null;
  for (const item of readings) {
    if ('timestamp' in item && (!temperature || new Date(item.timestamp) > new Date(temperature.timestamp))) {
      temperature = item;
    }
  }
  return { temperature, status: status.data };
}

export async function saveDifference(dif: number, signal?: AbortSignal): Promise<void> {
  if (!Number.isInteger(dif) || dif < 0 || dif > 20) throw new Error('Differenz muss eine ganze Zahl zwischen 0 und 20 sein.');
  await axios.post(`${backend}/temperatures/dif`, { dif }, { signal });
}
