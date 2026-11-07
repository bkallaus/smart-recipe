type GoogleIdentityId = { disableAutoSelect: () => void };

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const LOAD_TIMEOUT_MS = 2000;

const getGoogleIdentityId = (): GoogleIdentityId | undefined =>
  (window as Window & { google?: { accounts?: { id?: GoogleIdentityId } } })
    .google?.accounts?.id;

/**
 * Turns off Google One Tap auto-select so a signed-out user is not silently
 * signed back in. The Google Identity script is usually not loaded on signed-in
 * pages, so it is loaded first. Resolves even if the script fails or is slow.
 */
export const disableGoogleAutoSelect = () =>
  new Promise<void>((resolve) => {
    const identity = getGoogleIdentityId();

    if (identity) {
      identity.disableAutoSelect();
      resolve();
      return;
    }

    const script = document.createElement('script');
    const timer = window.setTimeout(() => resolve(), LOAD_TIMEOUT_MS);

    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => {
      window.clearTimeout(timer);
      getGoogleIdentityId()?.disableAutoSelect();
      resolve();
    };
    script.onerror = () => {
      window.clearTimeout(timer);
      resolve();
    };
    document.head.appendChild(script);
  });
