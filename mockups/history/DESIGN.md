# History navigation mockup

- Revision: 2
- Review status: in review
- Approval: not yet approved; production implementation is not authorized.

## Goal and scope
Explore selecting historical days, months, and years in the existing SolarHeat temperature chart without changing production code or the backend.

## Layout and interaction
- Preserve the light cards, blue controls, and yellow/blue/red temperature series.
- Keep a separate current-temperature card above the history chart, including pump status.
- Show “Zuletzt aktualisiert” with local HH:mm:ss and an Aktualisieren button in the card footer.
- Refresh simulates a short pending state, disables the button temporarily, and updates the timestamp without resetting history navigation or the difference input.
- Include a labeled Differenz (°C) number field (0–20, whole degrees, matching the current app) and Speichern button. Unsaved changes and simulated save confirmation are shown inline.
- Tag / Monat / Jahr controls the granularity; previous and next move one selected period.
- A native date/month picker (numeric year input for Jahr) selects a period directly.
- Heute / Dieser Monat / Dieses Jahr returns to the current period. Future navigation is disabled.
- Default to yesterday to demonstrate historical viewing; display a historical-view badge.
- Day labels use HH:mm, month labels use day numbers, and year labels use month abbreviations.
- On narrow screens the chart heading and range selector stack; navigation remains compact.
- No animation or persistence.

## Simulated and omitted behavior
- All readings and curves are deterministic examples, not real API data. No requests to the backend.
- Live values are illustrative; refresh only updates the demo timestamp. No real data is fetched.
- Saving the difference only shows a demo confirmation. It changes no backend setting and is not persisted.
- Native picker presentation depends on browser and operating system.
- Current-period examples show a full curve rather than truncating at the current time.
- Refresh has a simulated loading state. API errors, empty history, retention limits and additional settings are omitted from this small design exploration.
- Production needs an optional backend reference date plus an agreed timezone for day boundaries.

## Open review question
Does this compact period navigation provide enough control, or should selecting a date use a larger calendar popover?
