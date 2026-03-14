/** 토스 앱 내부(App-in-Toss) 런타임 감지 */
export function isIntossRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as unknown as Record<string, unknown>).ReactNativeWebView;
}
