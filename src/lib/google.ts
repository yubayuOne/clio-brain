import { Platform } from 'react-native';

type SignInModule = typeof import('@react-native-google-signin/google-signin');

/** Hidden per-app folder in the user's Drive; the app cannot see any other Drive file. */
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

let mod: SignInModule | null | undefined;
let configured = false;
let token: string | null = null;

/**
 * The sign-in library needs its native module (development build on Android), so it is loaded
 * lazily like the widget and sync is simply unavailable in Expo Go, on iOS and on web.
 * shortcut: the free library wraps Google's deprecated legacy Android sign-in SDK; move to the
 * Credential Manager / Authorization API if Google removes it from Play Services.
 */
function signIn(): SignInModule | null {
  if (mod === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = Platform.OS === 'android' ? (require('@react-native-google-signin/google-signin') as SignInModule) : null;
    } catch {
      mod = null;
    }
  }
  if (mod && !configured) {
    mod.GoogleSignin.configure({ scopes: [DRIVE_SCOPE] });
    configured = true;
  }
  return mod;
}

export const driveAvailable = (): boolean => signIn() !== null;

/** Email of the connected Google account, or null when not connected. */
export const driveAccount = (): string | null => signIn()?.GoogleSignin.getCurrentUser()?.user.email ?? null;

export type Connect =
  | { ok: true; email: string }
  | { ok: false; reason: 'unavailable' | 'signedOut' | 'cancelled' | 'failed'; message: string };

/**
 * Restores the previous sign-in, or (interactive) shows Google's sign-in and consent screens.
 * Never shows UI when `interactive` is false, so background syncs stay silent.
 */
export async function connectDrive(interactive: boolean): Promise<Connect> {
  const m = signIn();
  if (!m) return { ok: false, reason: 'unavailable', message: 'Google Drive sync needs the Android app.' };
  const { GoogleSignin } = m;
  try {
    const silent = await GoogleSignin.signInSilently();
    let user = silent.type === 'success' ? silent.data : null;
    if (!user) {
      if (!interactive) return { ok: false, reason: 'signedOut', message: '' };
      await GoogleSignin.hasPlayServices();
      const res = await GoogleSignin.signIn();
      if (res.type !== 'success') return { ok: false, reason: 'cancelled', message: 'Sign-in cancelled.' };
      user = res.data;
    }
    if (!user.scopes.includes(DRIVE_SCOPE)) {
      if (!interactive) return { ok: false, reason: 'signedOut', message: '' };
      const granted = await GoogleSignin.addScopes({ scopes: [DRIVE_SCOPE] });
      if (granted?.type !== 'success') {
        return { ok: false, reason: 'cancelled', message: 'Google Drive access was not allowed.' };
      }
    }
    token = (await GoogleSignin.getTokens()).accessToken;
    return { ok: true, email: user.user.email };
  } catch (e) {
    const code = m.isErrorWithCode(e) ? e.code : '';
    if (code === m.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { ok: false, reason: 'failed', message: 'Google Play services are needed to sign in.' };
    }
    // Code 10 (DEVELOPER_ERROR) means the OAuth client does not match this build's package or SHA-1.
    return { ok: false, reason: 'failed', message: `Google sign-in failed${code ? ` (code ${code})` : ''}.` };
  }
}

export async function disconnectDrive(): Promise<void> {
  token = null;
  await signIn()?.GoogleSignin.signOut();
}

/** fetch with the Drive access token; an expired token is refreshed once. */
export async function authorizedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const m = signIn();
  if (!m) throw new Error('Google sign-in is unavailable');
  const call = (t: string) => fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${t}` } });
  token ??= (await m.GoogleSignin.getTokens()).accessToken;
  let res = await call(token);
  if (res.status === 401) {
    await m.GoogleSignin.clearCachedAccessToken(token);
    token = (await m.GoogleSignin.getTokens()).accessToken;
    res = await call(token);
  }
  return res;
}
