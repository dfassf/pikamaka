import { describe, expect, it } from 'vitest';
import { AUDIO } from '@/app/lib/constants';
import {
  detectMicStateFromFrame,
  getEnergyRatios,
  getUpdatedNoiseFloor,
  getVolumeThresholds,
  resolveDebouncedState,
} from '@/app/lib/audioDetection';

describe('audioDetection', () => {
  it('returns zero ratios for silent frame', () => {
    const ratios = getEnergyRatios(new Uint8Array([0, 0, 0, 0]), 8000);
    expect(ratios).toEqual({ lowRatio: 0, hissRatio: 0 });
  });

  it('calculates low/hiss ratios from frequency bins', () => {
    const freqData = new Uint8Array([10, 10, 0, 0, 5, 5, 0, 0]);
    const ratios = getEnergyRatios(freqData, 8000);

    expect(ratios.lowRatio).toBeCloseTo(20 / 30, 5);
    expect(ratios.hissRatio).toBeCloseTo(10 / 30, 5);
  });

  it('updates noise floor with smoothing and keeps value while sounding', () => {
    expect(getUpdatedNoiseFloor(0, 0.5, false, true)).toBeCloseTo(0.1, 5);
    expect(getUpdatedNoiseFloor(0.2, 0.8, true, false)).toBeCloseTo(0.2, 5);
    expect(getUpdatedNoiseFloor(0.2, 0.1, false, false)).toBeCloseTo(0.198, 5);
  });

  it('builds quiet/loud thresholds from noise floor', () => {
    const thresholds = getVolumeThresholds(0.01);
    expect(thresholds.quiet).toBeCloseTo(0.01 + AUDIO.QUIET_OFFSET, 8);
    expect(thresholds.loud).toBeCloseTo(0.01 + AUDIO.LOUD_OFFSET, 8);
  });

  it('detects mic state from frame values', () => {
    expect(detectMicStateFromFrame({
      rms: 0.2,
      lowRatio: AUDIO.LOW_R_THRESHOLD + 0.1,
      hissRatio: 0.05,
      quietThreshold: 0.01,
      loudThreshold: 0.02,
    })).toBe('exhaling');

    expect(detectMicStateFromFrame({
      rms: 0.03,
      lowRatio: 0.1,
      hissRatio: AUDIO.HISS_THRESHOLD + 0.1,
      quietThreshold: 0.01,
      loudThreshold: 0.05,
    })).toBe('inhaling');

    expect(detectMicStateFromFrame({
      rms: 0.04,
      lowRatio: 0.1,
      hissRatio: 0.01,
      quietThreshold: 0.01,
      loudThreshold: 0.08,
    })).toBe('inhaling');

    expect(detectMicStateFromFrame({
      rms: 0.015,
      lowRatio: 0.1,
      hissRatio: 0.01,
      quietThreshold: 0.01,
      loudThreshold: 0.08,
    })).toBe('idle');
  });

  it('resolves debounced state transitions', () => {
    const changed = resolveDebouncedState({
      detectedState: 'inhaling',
      pendingState: 'idle',
      pendingStartMs: 0,
      lastCommittedState: 'idle',
      nowMs: 100,
    });
    expect(changed.pendingState).toBe('inhaling');
    expect(changed.pendingStartMs).toBe(100);
    expect(changed.committedState).toBeNull();

    const committed = resolveDebouncedState({
      detectedState: 'inhaling',
      pendingState: 'inhaling',
      pendingStartMs: 100,
      lastCommittedState: 'idle',
      nowMs: 300,
    });
    expect(committed.committedState).toBe('inhaling');

    const noDuplicateCommit = resolveDebouncedState({
      detectedState: 'inhaling',
      pendingState: 'inhaling',
      pendingStartMs: 100,
      lastCommittedState: 'inhaling',
      nowMs: 300,
    });
    expect(noDuplicateCommit.committedState).toBeNull();
  });
});
