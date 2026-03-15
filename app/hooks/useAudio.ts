'use client';

import { useRef, useCallback } from 'react';
import { MicState } from '@/app/lib/types';
import { AUDIO } from '@/app/lib/constants';
import {
  detectMicStateFromFrame,
  getEnergyRatios,
  getUpdatedNoiseFloor,
  getVolumeThresholds,
  resolveDebouncedState,
} from '@/app/lib/audioDetection';

interface UseAudioCallbacks {
  onStateChange: (state: MicState, prevState: MicState) => void;
  onVolume: (rms: number, isQuiet: boolean) => void;
}

export default function useAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const freqDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const timeBufRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  const activeRef = useRef(false);
  const lastMicStateRef = useRef<MicState>('idle');
  const pendingStateRef = useRef<MicState>('idle');
  const pendingStartMsRef = useRef(0);
  const noiseFloorRef = useRef(0);
  const nfInitRef = useRef(true);
  const callbacksRef = useRef<UseAudioCallbacks | null>(null);

  // RMS 계산 (타임도메인 기반)
  const getRMS = useCallback(() => {
    const analyser = analyserRef.current;
    const timeBuf = timeBufRef.current;
    if (!analyser || !timeBuf) return 0;
    analyser.getFloatTimeDomainData(timeBuf);
    let sum = 0;
    for (let i = 0; i < timeBuf.length; i++) {
      sum += timeBuf[i] * timeBuf[i];
    }
    return Math.sqrt(sum / timeBuf.length);
  }, []);

  // 감지 루프
  const detectSound = useCallback(function loop(doneRef: React.RefObject<boolean>) {
    if (!activeRef.current) return;
    if (doneRef.current) {
      requestAnimationFrame(() => loop(doneRef));
      return;
    }

    const analyser = analyserRef.current;
    const audioCtx = audioCtxRef.current;
    const freqData = freqDataRef.current;
    const cbs = callbacksRef.current;
    if (!analyser || !audioCtx || !freqData || !cbs) return;

    // 1) RMS 볼륨
    const rms = getRMS();

    // 2) 주파수 대역 비율
    analyser.getByteFrequencyData(freqData);
    const { lowRatio, hissRatio } = getEnergyRatios(freqData, audioCtx.sampleRate);

    // 3) 노이즈 바닥 + 동적 임계값
    const currentNoiseFloor = noiseFloorRef.current;
    const isSounding = rms > currentNoiseFloor + AUDIO.SOUNDING_OFFSET;
    const nextNoiseFloor = getUpdatedNoiseFloor(
      currentNoiseFloor,
      rms,
      isSounding,
      nfInitRef.current
    );
    noiseFloorRef.current = nextNoiseFloor;
    nfInitRef.current = false;
    const { quiet, loud } = getVolumeThresholds(nextNoiseFloor);

    // 볼륨 콜백
    cbs.onVolume(rms, rms <= quiet);

    // 4) 상태 판정
    const detected = detectMicStateFromFrame({
      rms,
      lowRatio,
      hissRatio,
      quietThreshold: quiet,
      loudThreshold: loud,
    });

    // 5) 시간 기반 디바운싱
    const now = performance.now();
    const debounceResult = resolveDebouncedState({
      detectedState: detected,
      pendingState: pendingStateRef.current,
      pendingStartMs: pendingStartMsRef.current,
      lastCommittedState: lastMicStateRef.current,
      nowMs: now,
    });
    pendingStateRef.current = debounceResult.pendingState;
    pendingStartMsRef.current = debounceResult.pendingStartMs;

    if (debounceResult.committedState) {
      const prevState = lastMicStateRef.current;
      lastMicStateRef.current = debounceResult.committedState;
      cbs.onStateChange(debounceResult.committedState, prevState);
    }

    // 후— 상태일 때 연기 계속 (콜백에서 처리하도록 rms 전달)
    // → onVolume에서 처리

    requestAnimationFrame(() => loop(doneRef));
  }, [getRMS]);

  // 마이크 시작
  const startMic = useCallback(async (
    callbacks: UseAudioCallbacks,
    doneRef: React.RefObject<boolean>
  ) => {
    callbacksRef.current = callbacks;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      },
    });

    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = AUDIO.ANALYSER.fftSize;
    analyser.smoothingTimeConstant = AUDIO.ANALYSER.smoothingTimeConstant;
    analyser.minDecibels = AUDIO.ANALYSER.minDecibels;
    analyser.maxDecibels = AUDIO.ANALYSER.maxDecibels;

    const gainNode = ctx.createGain();
    gainNode.gain.value = AUDIO.GAIN;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = AUDIO.COMPRESSOR.threshold;
    comp.knee.value = AUDIO.COMPRESSOR.knee;
    comp.ratio.value = AUDIO.COMPRESSOR.ratio;
    comp.attack.value = AUDIO.COMPRESSOR.attack;
    comp.release.value = AUDIO.COMPRESSOR.release;

    const src = ctx.createMediaStreamSource(stream);
    src.connect(gainNode);
    gainNode.connect(comp);
    comp.connect(analyser);

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    micStreamRef.current = stream;
    freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    timeBufRef.current = new Float32Array(analyser.fftSize);

    noiseFloorRef.current = 0;
    nfInitRef.current = true;
    lastMicStateRef.current = 'idle';
    pendingStateRef.current = 'idle';
    activeRef.current = true;

    detectSound(doneRef);
  }, [detectSound]);

  // 마이크 정지
  const stopMic = useCallback(() => {
    activeRef.current = false;
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    micStreamRef.current = null;
    lastMicStateRef.current = 'idle';
  }, []);

  return { startMic, stopMic };
}
