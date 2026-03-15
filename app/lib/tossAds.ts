import { isIntossRuntime } from './intoss';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';

const INTERSTITIAL_ID =
  process.env.NEXT_PUBLIC_AD_INTERSTITIAL_ID || 'ait-ad-test-interstitial-id';

const AD_TIMEOUT_MS = 15_000;

export function isAdsSupported(): boolean {
  return isIntossRuntime();
}

function runLoadAndShow(
  adGroupId: string,
  opts: { trackReward?: boolean; timeoutFallback: boolean | string },
): Promise<boolean | string> {
  return new Promise<boolean | string>((resolve) => {
    let earned = false;
    let settled = false;
    let cleanupLoad: (() => void) | null = null;
    let cleanupShow: (() => void) | null = null;

    const finish = (result: boolean | string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      if (cleanupLoad) cleanupLoad();
      if (cleanupShow) cleanupShow();
      resolve(result);
    };

    const timeoutId = window.setTimeout(() => {
      finish(opts.timeoutFallback);
    }, AD_TIMEOUT_MS);

    cleanupLoad = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => {
        if (event.type !== 'loaded') return;
        if (cleanupLoad) {
          cleanupLoad();
          cleanupLoad = null;
        }
        cleanupShow = showFullScreenAd({
          options: { adGroupId },
          onEvent: (showEvent) => {
            if (showEvent.type === 'userEarnedReward') earned = true;
            if (showEvent.type === 'dismissed') {
              finish(opts.trackReward ? earned : true);
              return;
            }
            if (showEvent.type === 'failedToShow') {
              finish(false);
            }
          },
          onError: (err) => {
            console.warn('[ad] show error:', err);
            finish(false);
          },
        });
      },
      onError: (err) => {
        finish(err instanceof Error ? `[ad] load: ${err.message}` : '[ad] load failed');
      },
    });
  });
}

export async function loadAndShowInterstitial(): Promise<boolean | string> {
  if (!isAdsSupported()) return false;
  try {
    return await runLoadAndShow(INTERSTITIAL_ID, { timeoutFallback: false });
  } catch (err) {
    console.warn('[ad] interstitial failed:', err);
    return false;
  }
}
