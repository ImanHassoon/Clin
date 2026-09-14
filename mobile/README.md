# Clin mobile app

Expo + React Native (TypeScript) app implementing the doctor and patient
sides described in [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

## Setup

```bash
npm install
```

Point the app at your running backend by editing `extra.apiUrl` in
`app.json`:

- Web / iOS simulator / Android emulator on the same machine as the API:
  `http://localhost:4000/api/v1` (already the default).
- A physical device: use your computer's LAN IP instead of `localhost`,
  e.g. `http://192.168.1.20:4000/api/v1` — the device can't resolve your
  computer's `localhost`.

Then start Metro:

```bash
npm start        # then press i / a / w, or scan the QR code with Expo Go
```

## Structure

- `src/api/client.ts` — fetch wrapper: attaches the access token, retries
  once after a silent refresh on a 401.
- `src/context/AuthContext.tsx` — login/register/logout, persists the
  refresh token in `expo-secure-store`, bootstraps a session on app start.
- `src/navigation/` — `RootNavigator` picks `AuthNavigator` /
  `DoctorNavigator` / `PatientNavigator` based on the signed-in user's role.
- `src/screens/{auth,doctor,patient}/` — one screen per file, matching the
  UX flows in the architecture doc.

## Role-based navigation

- **Doctor**: Today's schedule → Patients (list → detail → new visit → add
  test/imaging) → Appointments → Profile.
- **Patient**: Home → Find a doctor → book appointment → My records (visit
  timeline, imaging viewer) → Profile → who has access to my records.
- **Clinic admin**: shows a placeholder — that console isn't built in this
  scaffold (see the architecture doc's "not implemented yet" section).

## Known limitations

- The imaging viewer opens a full-screen image on tap but does not yet
  support pinch-to-zoom; that needs a gesture library
  (`react-native-gesture-handler` + a zoom view) not included here.
- No automated tests, no push notifications, no offline support.
- Verified with `npm run typecheck` in this environment; there's no
  simulator/device here to run the app visually, so give it a real run
  (`npm start`) before shipping.
