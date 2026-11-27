import { initializeApp } from "firebase/app"
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check"
import { getAuth } from "firebase/auth"
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore"

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(config)

/**
 * Firebase AI Logic requires App Check. With a debug token (local development, or a submission build) the SDK skips attestation;
 * otherwise reCAPTCHA Enterprise attests the page. The token is a secret: it lives in .env.local, never in the repository.
 */
const debugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN
if (debugToken) (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: string }).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken
export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY || "unset"),
  isTokenAutoRefreshEnabled: true,
})

export const auth = getAuth(app)
/** Offline persistence: writing keeps working with the network off and syncs when it returns. */
export const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })