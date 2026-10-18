import { useCallback, useEffect, useRef, useState } from 'react';
import { getLive, saveDifference } from './temperature-api';
import { dateInputValue } from './temperature-data';

export function useLiveTemperatures() {
  const [live, setLive] = useState<Awaited<ReturnType<typeof getLive>> | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const activeRefresh = useRef<AbortController | null>(null);
  const activeSave = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (activeSave.current) return;
    activeRefresh.current?.abort();
    const controller = new AbortController();
    activeRefresh.current = controller;
    setRefreshing(true);
    try {
      const result = await getLive(dateInputValue(new Date()), controller.signal);
      if (controller.signal.aborted) return;
      setLive(result);
      setLastUpdated(new Date());
      setLiveError(null);
    } catch {
      if (!controller.signal.aborted) setLiveError('Live-Werte konnten nicht aktualisiert werden.');
    } finally {
      if (activeRefresh.current === controller) {
        activeRefresh.current = null;
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => {
      clearInterval(interval);
      activeRefresh.current?.abort();
      activeRefresh.current = null;
      activeSave.current?.abort();
      activeSave.current = null;
    };
  }, [refresh]);

  const save = async (difference: number): Promise<boolean> => {
    if (activeSave.current) return false;
    // A pre-save status request must not overwrite the value after saving.
    activeRefresh.current?.abort();
    activeRefresh.current = null;
    setRefreshing(false);
    const controller = new AbortController();
    activeSave.current = controller;
    setSaving(true);
    setSaveError(null);
    try {
      await saveDifference(difference, controller.signal);
      if (controller.signal.aborted) return false;
      setLive((current) => current ? { ...current, status: { ...current.status, dif: difference } } : current);
      return true;
    } catch {
      if (!controller.signal.aborted) setSaveError('Differenz konnte nicht gespeichert werden.');
      return false;
    } finally {
      if (activeSave.current === controller) {
        activeSave.current = null;
        setSaving(false);
      }
    }
  };

  return { live, lastUpdated, refreshing, liveError, refresh, saving, saveError, save };
}
