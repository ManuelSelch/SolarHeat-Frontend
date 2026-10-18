const today = new Date();
today.setHours(0, 0, 0, 0);
let selected = new Date(today);
selected.setDate(selected.getDate() - 1);
let range = 'day';
const $ = (id) => document.getElementById(id);
const isoDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const periodKey = (date) => range === 'day' ? isoDate(date) : range === 'month' ? isoDate(date).slice(0, 7) : String(date.getFullYear());

function shift(direction) {
  if (range === 'day') selected.setDate(selected.getDate() + direction);
  if (range === 'month') { selected.setDate(1); selected.setMonth(selected.getMonth() + direction); }
  if (range === 'year') { selected.setDate(1); selected.setMonth(0); selected.setFullYear(selected.getFullYear() + direction); }
  render();
}

function renderChart() {
  const count = range === 'day' ? 49 : range === 'month' ? new Date(selected.getFullYear(), selected.getMonth() + 1, 0).getDate() : 12;
  const phase = (selected.getDate() + selected.getMonth() * 3 + selected.getFullYear()) % 13;
  const width = 800, height = 260, left = 35, right = 12, top = 12, bottom = 29;
  const x = (i) => left + i / (count - 1) * (width - left - right);
  const y = (v) => height - bottom - v / 80 * (height - top - bottom);
  let markup = '<svg viewBox="0 0 800 260" role="img" aria-label="Temperaturverlauf mit Beispieldaten">';
  for (const value of [0, 20, 40, 60, 80]) markup += `<line x1="${left}" y1="${y(value)}" x2="${width - right}" y2="${y(value)}" stroke="#e9edf2" stroke-dasharray="3 4"/><text x="${left - 10}" y="${y(value) + 4}" text-anchor="end" fill="#8c96a3" font-size="11">${value}</text>`;
  const curves = [
    { color:'#fab005', value:(i) => range === 'day' ? 12 + 39 * Math.exp(-Math.pow((i / (count - 1) - .57) * 5, 2)) + Math.sin(i * .8 + phase) * 2 : 24 + 11 * Math.sin(i * .5 + phase) + 4 * Math.cos(i * 1.3) },
    { color:'#228be6', value:(i) => 54 + 7 * Math.sin(i / count * 4 + phase / 5) + Math.cos(i * .6) * 1.5 },
    { color:'#fa5252', value:(i) => 69 + 1.5 * Math.cos(i / count * 5 + phase) },
  ];
  for (const curve of curves) markup += `<polyline fill="none" stroke="${curve.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${Array.from({ length:count }, (_, i) => `${x(i).toFixed(2)},${y(curve.value(i)).toFixed(2)}`).join(' ')}"/>`;
  for (let i = 0; i < 5; i++) {
    const label = range === 'day' ? `${String(i * 6).padStart(2, '0')}:00` : range === 'month' ? String(Math.round(i / 4 * (count - 1)) + 1).padStart(2, '0') + '.' : ['Jan', 'Apr', 'Jun', 'Sep', 'Dez'][i];
    markup += `<text x="${x(i / 4 * (count - 1))}" y="${height - 5}" text-anchor="${i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}" fill="#8c96a3" font-size="11">${label}</text>`;
  }
  $('chart').innerHTML = markup + '</svg>';
}

function render() {
  const current = periodKey(selected) === periodKey(today);
  const nouns = { day:'Tag', month:'Monat', year:'Jahr' };
  document.querySelectorAll('[data-range]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.range === range)));
  const input = $('date');
  input.type = range === 'day' ? 'date' : range === 'month' ? 'month' : 'number';
  input.min = range === 'year' ? '2000' : '';
  input.max = periodKey(today);
  input.value = periodKey(selected);
  input.setAttribute('aria-label', `${nouns[range]} auswählen`);
  $('previous').setAttribute('aria-label', `Vorheriger ${nouns[range]}`);
  $('next').setAttribute('aria-label', `Nächster ${nouns[range]}`);
  $('next').disabled = current;
  $('today').disabled = current;
  $('today').textContent = range === 'day' ? 'Heute' : range === 'month' ? 'Dieser Monat' : 'Dieses Jahr';
  $('period-title').textContent = range === 'day' ? selected.toLocaleDateString('de-DE', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : range === 'month' ? selected.toLocaleDateString('de-DE', { month:'long', year:'numeric' }) : `Jahr ${selected.getFullYear()}`;
  $('history-badge').hidden = current;
  $('resolution').textContent = range === 'day' ? 'Einzelne Messwerte im Tagesverlauf' : range === 'month' ? 'Durchschnittstemperatur pro Tag' : 'Durchschnittstemperatur pro Monat';
  $('period-note').textContent = current ? 'Aktueller Zeitraum · Beispieldaten' : 'Historische Ansicht · Live-Werte oben bleiben aktuell';
  renderChart();
}

function showLastUpdate(date) {
  $('last-update').dateTime = date.toISOString();
  $('last-update').textContent = date.toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
}
showLastUpdate(new Date(Date.now() - 60000));

$('refresh').addEventListener('click', () => {
  $('refresh').disabled = true;
  $('refresh').setAttribute('aria-label', 'Wird aktualisiert…');
  document.querySelector('.live-card').setAttribute('aria-busy', 'true');
  // Simulated request only: do not reload the page or change the history selection.
  setTimeout(() => {
    showLastUpdate(new Date());
    $('refresh').disabled = false;
    $('refresh').setAttribute('aria-label', 'Aktualisieren');
    document.querySelector('.live-card').setAttribute('aria-busy', 'false');
  }, 650);
});

$('difference-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!$('difference-form').reportValidity()) return;
  $('difference-status').textContent = `${$('difference').value} °C gespeichert (Demo)`;
  $('difference-status').dataset.saved = 'true';
});
$('difference').addEventListener('input', () => {
  $('difference-status').textContent = 'Nicht gespeicherte Änderung';
  $('difference-status').dataset.saved = 'false';
});

$('previous').addEventListener('click', () => shift(-1));
$('next').addEventListener('click', () => shift(1));
$('today').addEventListener('click', () => { selected = new Date(today); render(); });
$('date').addEventListener('change', (event) => {
  if (!event.target.value || !event.target.validity.valid) { render(); return; }
  const parts = event.target.value.split('-').map(Number);
  selected = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
  if (periodKey(selected) > periodKey(today)) selected = new Date(today);
  render();
});
document.querySelectorAll('[data-range]').forEach((button) => button.addEventListener('click', () => { range = button.dataset.range; render(); }));
render();
