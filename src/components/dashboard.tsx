'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ChartTooltip, LineChart } from '@mantine/charts';
import { IconChevronLeft, IconChevronRight, IconRefresh } from '@tabler/icons-react';
import { getHistory } from './temperature-api';
import {
  chartPointsForPeriod, dateInputValue, dayAxisMinutes, dayAxisTicks, formatDayAxisTick, formatChartLabel, formatPeriodTitle,
  normalizeChartData, parsePeriodInput, periodKey, shiftPeriod,
  type TemperatureChartPoint, type TemperatureRange,
} from './temperature-data';
import { useLiveTemperatures } from './use-live-temperatures';
import styles from './dashboard.module.css';

const ranges: { value: TemperatureRange; label: string }[] = [
  { value: 'day', label: 'Tag' },
  { value: 'month', label: 'Monat' },
  { value: 'year', label: 'Jahr' },
];

function timeLabel(date: Date): string {
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function PeriodPicker({ date, range, today, onChange }: {
  date: string; range: TemperatureRange; today: string; onChange: (date: string) => void;
}) {
  const [value, setValue] = useState(periodKey(date, range));
  return (
    <input
      className={styles.dateInput}
      type={range === 'day' ? 'date' : range === 'month' ? 'month' : 'number'}
      aria-label={`${ranges.find((item) => item.value === range)?.label} auswählen`}
      min={range === 'year' ? '1000' : range === 'month' ? '1000-01' : '1000-01-01'}
      max={periodKey(today, range)}
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
        const parsed = parsePeriodInput(event.target.value, range, today);
        if (parsed) onChange(parsed);
      }}
      onBlur={() => setValue(periodKey(date, range))}
    />
  );
}

export default function Dashboard() {
  const { live, lastUpdated, refreshing, liveError, refresh, saving, saveError, save } = useLiveTemperatures();
  const [range, setRange] = useState<TemperatureRange>('day');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [history, setHistory] = useState<{ data: TemperatureChartPoint[]; loading: boolean; error: string | null }>({ data: [], loading: true, error: null });
  // Keep the editable draft separate from the polled server value.
  const [differenceDraft, setDifferenceDraft] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => { setSelectedDate(dateInputValue(new Date())); }, []);

  useEffect(() => {
    if (!selectedDate) return;
    let controller: AbortController | null = null;
    setHistory({ data: [], loading: true, error: null });
    const fetchHistory = async () => {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      try {
        const response = normalizeChartData(await getHistory(range, selectedDate, request.signal));
        if (request.signal.aborted) return;
        const points = chartPointsForPeriod(response, range, selectedDate);
        const mismatch = response.length > 0 && points.length === 0;
        setHistory({
          data: points, loading: false,
          error: mismatch ? 'Die Serverantwort passt nicht zum gewählten Zeitraum. Das Backend muss historische Datumsabfragen noch unterstützen.' : null,
        });
      } catch {
        if (!request.signal.aborted) {
          setHistory((current) => ({ ...current, loading: false, error: 'Temperaturen konnten nicht geladen werden.' }));
        }
      }
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => { controller?.abort(); clearInterval(interval); };
  }, [range, selectedDate]);

  const today = dateInputValue(new Date());
  const currentPeriod = !!selectedDate && periodKey(selectedDate, range) === periodKey(today, range);
  const selectedRange = ranges.find((item) => item.value === range)!;
  const periodTitle = selectedDate ? formatPeriodTitle(selectedDate, range) : '…';
  const difference = differenceDraft ?? (live ? String(live.status.dif) : '');
  const validDifference = difference.trim() !== '' && Number.isInteger(Number(difference)) && Number(difference) >= 0 && Number(difference) <= 20;
  const temperature = live?.temperature;
  const lastEntry = live?.status.time ? new Date(live.status.time) : temperature ? new Date(temperature.timestamp) : null;
  const readings = [
    { name: 'Solar', value: temperature?.solar, color: 'solar' },
    { name: 'Tank', value: temperature?.pump, color: 'tank' },
    { name: 'Security', value: temperature?.security, color: 'security' },
  ];

  const submitDifference = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validDifference) return;
    setSaveMessage(null);
    if (await save(Number(difference))) {
      setDifferenceDraft(null);
      setSaveMessage('Gespeichert');
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <h1>Heizungssteuerung</h1>
        </header>

        <section className={styles.card} aria-labelledby="live-title">
          <div className={styles.cardHeader}>
            <h2 id="live-title">Aktuelle Temperaturen</h2>
            <span className={`${styles.liveBadge} ${liveError ? styles.offline : ''}`}><span />{liveError ? 'Verbindung gestört' : live ? 'Live' : 'Lädt…'}</span>
          </div>
          <div className={styles.readings}>
            {readings.map((reading) => (
              <div key={reading.name}>
                <span className={styles.sensor}><i className={styles[reading.color]} />{reading.name}</span>
                <strong>{reading.value ?? '—'} <small>°C</small></strong>
              </div>
            ))}
          </div>
          <p className={styles.pumpStatus}>{temperature ? `Pumpe ist ${temperature.rel === 1 ? 'AN' : 'AUS'}` : 'Pumpenstatus nicht verfügbar'}</p>
          {liveError && <p className={styles.error} role="alert">{liveError} Bereits angezeigte Werte können veraltet sein.</p>}
          {!temperature && live && <p className={styles.note}>Heute sind noch keine Messwerte vorhanden.</p>}

          <form className={styles.differenceForm} onSubmit={submitDifference}>
            <label htmlFor="difference">Differenz <span>(°C)</span></label>
            <div className={styles.differenceControls}>
              <input
                id="difference" type="number" min={0} max={20} step={1} required
                value={difference} disabled={!live || saving} aria-describedby="difference-status"
                onChange={(event) => { setDifferenceDraft(event.target.value); setSaveMessage(null); }}
              />
              <button className={styles.saveButton} type="submit" disabled={!live || saving || !validDifference}>{saving ? 'Speichert…' : 'Speichern'}</button>
            </div>
            <span id="difference-status" className={saveError ? styles.error : saveMessage ? styles.saved : styles.note} role="status">
              {saveError ?? saveMessage ?? (differenceDraft !== null ? 'Nicht gespeicherte Änderung' : '')}
            </span>
          </form>

          <div className={styles.liveFooter}>
            <div className={styles.timestamps}>
              <p>Zuletzt aktualisiert: {lastUpdated ? <time dateTime={lastUpdated.toISOString()}>{timeLabel(lastUpdated)}</time> : '—'}</p>
              <p>Letzter Eintrag: {lastEntry ? <time dateTime={lastEntry.toISOString()} title="Letzter von der Maschine gesendeter und gespeicherter Messwert">{lastEntry.toLocaleDateString('de-DE')} {timeLabel(lastEntry)}</time> : '—'}</p>
            </div>
            <button
              className={styles.refreshButton} type="button" onClick={refresh} disabled={refreshing || saving}
              aria-label={refreshing ? 'Wird aktualisiert…' : 'Aktualisieren'} title="Aktualisieren" aria-busy={refreshing}
            ><IconRefresh size={16} aria-hidden /></button>
          </div>
        </section>

        <section className={`${styles.card} ${styles.historyCard}`} aria-labelledby="chart-title">
          <div className={styles.chartHeader}>
            <h2 id="chart-title">Temperaturverlauf</h2>
            <div className={styles.tabs} role="group" aria-label="Zeitraum">
              {ranges.map((item) => <button key={item.value} type="button" aria-pressed={range === item.value} onClick={() => setRange(item.value)}>{item.label}</button>)}
            </div>
          </div>
          <div className={styles.navigation}>
            <div className={styles.dateControls}>
              <button className={styles.arrow} type="button" aria-label={range === 'year' ? 'Vorheriges Jahr' : `Vorheriger ${selectedRange.label}`} disabled={!selectedDate || periodKey(selectedDate, range) <= periodKey('1000-01-01', range)} onClick={() => selectedDate && setSelectedDate(shiftPeriod(selectedDate, range, -1))}><IconChevronLeft size={18} aria-hidden /></button>
              {selectedDate && <PeriodPicker key={`${range}:${selectedDate}`} date={selectedDate} range={range} today={today} onChange={setSelectedDate} />}
              <button className={styles.arrow} type="button" aria-label={range === 'year' ? 'Nächstes Jahr' : `Nächster ${selectedRange.label}`} disabled={!selectedDate || currentPeriod} onClick={() => selectedDate && setSelectedDate(shiftPeriod(selectedDate, range, 1))}><IconChevronRight size={18} aria-hidden /></button>
            </div>
            <button className={styles.todayButton} type="button" disabled={currentPeriod || !selectedDate} onClick={() => setSelectedDate(today)}>{range === 'day' ? 'Heute' : range === 'month' ? 'Dieser Monat' : 'Dieses Jahr'}</button>
          </div>
          <div className={styles.periodHeading}>
            <h3 aria-live="polite">{periodTitle}</h3>
          </div>

          {history.loading ? <div className={styles.chartState} role="status">Temperaturen werden geladen…</div>
            : history.error && !history.data.length ? <div className={`${styles.chartState} ${styles.error}`} role="alert">{history.error}</div>
            : !history.data.length ? <div className={styles.chartState} role="status">Keine Messdaten für {periodTitle} vorhanden.</div>
            : <>
              {history.error && <p className={styles.error} role="alert">{history.error}</p>}
              <LineChart
                h={280} withDots={history.data.length === 1}
                data={history.data.map((item) => ({ ...item, label: range === 'day' ? dayAxisMinutes(item.date) : formatChartLabel(item.date, range) }))}
                dataKey="label" unit=" °C" strokeWidth={2.5} curveType="linear"
                xAxisProps={range === 'day' ? {
                  type: 'number', domain: [0, 1440], allowDataOverflow: true,
                  ticks: dayAxisTicks(4), interval: 0,
                  tickFormatter: formatDayAxisTick, tick: { fontSize: 10 },
                } : undefined}
                tooltipProps={range === 'day' ? {
                  content: ({ payload }) => <ChartTooltip
                    label={payload?.[0]?.payload?.date ? formatChartLabel(payload[0].payload.date, 'day') : undefined}
                    payload={payload ?? []} unit=" °C"
                    series={[{ name: 'solar', label: 'Solar', color: 'yellow.6' }, { name: 'pump', label: 'Tank', color: 'blue.6' }, { name: 'security', label: 'Security', color: 'red.6' }]}
                  />,
                } : undefined}
                series={[{ name: 'solar', label: 'Solar', color: 'yellow.6' }, { name: 'pump', label: 'Tank', color: 'blue.6' }, { name: 'security', label: 'Security', color: 'red.6' }]}
              />
            </>}
          <div className={styles.legend} aria-label="Temperaturreihen">{readings.map((reading) => <span key={reading.name}><i className={styles[reading.color]} />{reading.name}</span>)}</div>
        </section>
      </div>
    </main>
  );
}
