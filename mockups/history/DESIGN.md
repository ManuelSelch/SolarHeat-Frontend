# History navigation mockup

- Revision: 5
- Review status: approved
- Prior approval: user approved revision 3 with “looks good. Now implement the frontend”, then paused implementation to add the last machine/database entry timestamp.
- Approval: revision 5 explicitly approved by the user: “looks good. now implement it”. Implement the frontend only; send the new optional date=YYYY-MM-DD argument while leaving the backend unchanged.

## Goal and scope
Explore selecting historical days, months, and years in the existing SolarHeat temperature chart without changing production code or the backend.

## Layout and interaction
- Preserve the light cards, blue controls, and yellow/blue/red temperature series.
- Keep a separate current-temperature card above the history chart, including pump status.
- In the card footer, beside “Zuletzt aktualisiert”, show “Letzter Eintrag” with date and local HH:mm:ss for the last machine/database reading. It is distinct from the frontend refresh timestamp and does not advance just because refresh was clicked. Production can use the existing status.time field.
- Show “Zuletzt aktualisiert” with local HH:mm:ss and a black, icon-only refresh button in the card footer, with an accessible name and tooltip.
- Refresh simulates a short pending state, disables the button temporarily, and updates the timestamp without resetting history navigation or the difference input.
- Include a labeled Differenz (°C) number field (0–20, whole degrees, matching the current app) and Speichern button. The initial status is blank (no preview disclaimer beside the input); unsaved changes and simulated save confirmation are shown inline.
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

## Implementation notes
- During implementation, the user explicitly requested removing the top SolarHeat icon and text. Production keeps only the Heizungssteuerung heading; the approved mockup source is preserved as the reference.
- Production opens on today, rather than the demo's yesterday selection, and uses real loading/error/empty states and a compatibility message when the old backend ignores date.
- Frontend date values and labels use the browser's local calendar/timezone; the backend date-argument implementation remains a follow-up.
