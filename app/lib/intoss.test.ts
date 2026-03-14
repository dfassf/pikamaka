import { describe, expect, it } from 'vitest';
import { isIntossRuntime } from '@/app/lib/intoss';

describe('isIntossRuntime', () => {
  it('ReactNativeWebView가 없으면 false', () => {
    delete (window as unknown as Record<string, unknown>).ReactNativeWebView;
    expect(isIntossRuntime()).toBe(false);
  });

  it('ReactNativeWebView가 있으면 true', () => {
    (window as unknown as Record<string, unknown>).ReactNativeWebView = { postMessage: () => {} };
    expect(isIntossRuntime()).toBe(true);
  });
});
