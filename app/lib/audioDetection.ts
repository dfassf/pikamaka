import { AUDIO } from '@/app/lib/constants';
import { MicState } from '@/app/lib/types';

interface BandRanges {
  lowStart: number;
  lowEnd: number;
  hissStart: number;
  hissEnd: number;
}

interface FrameStateInput {
  rms: number;
  lowRatio: number;
  hissRatio: number;
  quietThreshold: number;
  loudThreshold: number;
}

interface DebounceInput {
  detectedState: MicState;
  pendingState: MicState;
  pendingStartMs: number;
  lastCommittedState: MicState;
  nowMs: number;
}

interface DebounceResult {
  pendingState: MicState;
  pendingStartMs: number;
  committedState: MicState | null;
}

function clampBandIndex(index: number, max: number) {
  return Math.max(0, Math.min(index, max));
}

function getBandRanges(binCount: number, sampleRate: number): BandRanges {
  const nyquist = sampleRate / 2;
  const maxIndex = Math.max(0, binCount - 1);

  return {
    lowStart: clampBandIndex(Math.floor(binCount * AUDIO.BAND_LOW_START / nyquist), maxIndex),
    lowEnd: clampBandIndex(Math.floor(binCount * AUDIO.BAND_LOW_END / nyquist), maxIndex + 1),
    hissStart: clampBandIndex(Math.floor(binCount * AUDIO.BAND_HISS_START / nyquist), maxIndex),
    hissEnd: clampBandIndex(Math.floor(binCount * AUDIO.BAND_HISS_END / nyquist), maxIndex + 1),
  };
}

export function getEnergyRatios(freqData: Uint8Array, sampleRate: number) {
  const ranges = getBandRanges(freqData.length, sampleRate);

  let totalEnergy = 0;
  let lowEnergy = 0;
  let hissEnergy = 0;

  for (let i = 0; i < freqData.length; i++) {
    const value = freqData[i];
    totalEnergy += value;
    if (i >= ranges.lowStart && i < ranges.lowEnd) lowEnergy += value;
    if (i >= ranges.hissStart && i < ranges.hissEnd) hissEnergy += value;
  }

  if (totalEnergy === 0) {
    return { lowRatio: 0, hissRatio: 0 };
  }

  return {
    lowRatio: lowEnergy / totalEnergy,
    hissRatio: hissEnergy / totalEnergy,
  };
}

export function getUpdatedNoiseFloor(
  currentNoiseFloor: number,
  rms: number,
  isSounding: boolean,
  isNoiseFloorInit: boolean
) {
  const alpha = isNoiseFloorInit ? 0.2 : (isSounding ? 0 : 0.02);
  if (alpha === 0) return currentNoiseFloor;
  return currentNoiseFloor * (1 - alpha) + rms * alpha;
}

export function getVolumeThresholds(noiseFloor: number) {
  return {
    quiet: noiseFloor + AUDIO.QUIET_OFFSET,
    loud: noiseFloor + AUDIO.LOUD_OFFSET,
  };
}

export function detectMicStateFromFrame({
  rms,
  lowRatio,
  hissRatio,
  quietThreshold,
  loudThreshold,
}: FrameStateInput): MicState {
  if (rms > loudThreshold && lowRatio > AUDIO.LOW_R_THRESHOLD) {
    return 'exhaling';
  }

  if (hissRatio > AUDIO.HISS_THRESHOLD || rms > quietThreshold * 3) {
    return 'inhaling';
  }

  return 'idle';
}

export function resolveDebouncedState({
  detectedState,
  pendingState,
  pendingStartMs,
  lastCommittedState,
  nowMs,
}: DebounceInput): DebounceResult {
  let nextPendingState = pendingState;
  let nextPendingStartMs = pendingStartMs;

  if (detectedState !== pendingState) {
    nextPendingState = detectedState;
    nextPendingStartMs = nowMs;
  }

  const holdMs = nowMs - nextPendingStartMs;
  const debounceMs = nextPendingState === 'idle' ? AUDIO.DEBOUNCE_IDLE : AUDIO.DEBOUNCE_ACTIVE;
  const shouldCommit = holdMs >= debounceMs && lastCommittedState !== nextPendingState;

  return {
    pendingState: nextPendingState,
    pendingStartMs: nextPendingStartMs,
    committedState: shouldCommit ? nextPendingState : null,
  };
}
