# Planboard Sync

Planboard Sync is a cross-device planner app with:

- account registration and login
- Firebase Auth + Firestore support for shared cloud sync
- SQLite database for local development
- shared calendar notes, day plans, and todos
- installable PWA UI for Windows and iPhone home screen

## Local development

```powershell
npm run start
```

Open `http://127.0.0.1:4173`.

For iPhone testing on the same Wi-Fi, open your Windows machine IP with port `4173`.

By default, the root app still uses the local Python API (`server.py`) and `data/planboard.db`.

Run the validation suite with:

```powershell
npm run check
npm test
```

## Firebase + Vercel deploy

The production static build can run directly against Firebase Auth + Firestore, so Vercel only needs to host the frontend.

### 1. Create Firebase resources

- create a Firebase project
- enable `Authentication > Email/Password`
- create a Cloud Firestore database
- publish the rules from [firestore.rules](./firestore.rules)
- register a Web app in Firebase and copy its config values

Firebase supports CDN-based setup for web apps, and Vercel can serve this app as a static site configured by [`vercel.json`](./vercel.json). Sources:
- Firebase web setup: https://firebase.google.com/docs/web/setup
- Firebase auth on web: https://firebase.google.com/docs/auth/web/start
- Cloud Firestore data writes: https://firebase.google.com/docs/firestore/manage-data/add-data
- Vercel `vercel.json`: https://vercel.com/docs/project-configuration/vercel-json

### 2. Add Vercel environment variables

Use the keys from [`.env.example`](./.env.example):

```text
PLANBOARD_DATA_SOURCE=firebase
PLANBOARD_FIREBASE_API_KEY=...
PLANBOARD_FIREBASE_AUTH_DOMAIN=...
PLANBOARD_FIREBASE_PROJECT_ID=...
PLANBOARD_FIREBASE_STORAGE_BUCKET=...
PLANBOARD_FIREBASE_MESSAGING_SENDER_ID=...
PLANBOARD_FIREBASE_APP_ID=...
PLANBOARD_FIREBASE_SDK_VERSION=12.4.0
```

`PLANBOARD_API_BASE_URL` should stay empty for the Firebase/Vercel version.

### 3. Deploy

Push the repo to GitHub, import it into Vercel, and let Vercel use the checked-in [`vercel.json`](./vercel.json).

The build command is:

```powershell
npm run prepare:web
```

The static output folder is:

```text
native-web
```

## Native wrappers

For the local REST backend flow, point the bundled app to the API server:

```powershell
$env:PLANBOARD_API_BASE_URL="http://YOUR_SERVER_OR_WINDOWS_IP:4173"
npm run prepare:web
```

Then:

```powershell
npm run mobile:ios
npm run desktop:pack
```

For real production use, replace the IP above with your HTTPS domain.

For the Firebase/Vercel flow, keep `PLANBOARD_API_BASE_URL` empty and set `PLANBOARD_DATA_SOURCE=firebase` with the Firebase env vars instead.

## Docker deploy

```powershell
docker build -t planboard-sync .
docker run -p 4173:4173 -e PORT=4173 -e PLANBOARD_ALLOWED_ORIGINS="https://your-app.example" planboard-sync
```

For real internet deployment, use your domain and set `PLANBOARD_ALLOWED_ORIGINS` to the exact frontend origins you trust.

Do not commit real environment files. Keep secrets and deployment values in `.env`, `.env.local`, or your hosting provider's environment settings; only `.env.example` belongs in Git.

## Cross-device sync

- Local mode: data lives in `data/planboard.db` through the Python API server.
- Cloud mode: data lives in Firebase Auth + Firestore and syncs between Windows and iPhone through the same account.
- Windows app: install from Edge/Chrome as a PWA, or wrap later with Tauri/Electron.
- iPhone app: use Safari `Add to Home Screen`, or wrap later with Capacitor for native packaging.
