'use client';

import { useRef, useCallback } from 'react';
import { MicState } from '@/app/lib/types';
import { AUDIO } from '@/app/lib/constants';

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

  // 노이즈 바닥 갱신
  const updateNoiseFloor = useCallback((rms: number, isSounding: boolean) => {
    const alpha = nfInitRef.current ? 0.2 : (isSounding ? 0.0 : 0.02);
    if (alpha > 0) {
      noiseFloorRef.current = noiseFloorRef.current * (1 - alpha) + rms * alpha;
    }
    nfInitRef.current = false;
  }, []);

  // 감지 루프
  const detectSound = useCallback((doneRef: React.RefObject<boolean>) => {
    if (!activeRef.current) return;
    if (doneRef.current) {
      requestAnimationFrame(() => detectSound(doneRef));
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
    const nyquist = audioCtx.sampleRate / 2;
    const b200 = Math.floor(freqData.length * AUDIO.BAND_LOW_START / nyquist);
    const b1200 = Math.floor(freqData.length * AUDIO.BAND_LOW_END / nyquist);
    const b2000 = Math.floor(freqData.length * AUDIO.BAND_HISS_START / nyquist);
    const b6000 = Math.floor(freqData.length * AUDIO.BAND_HISS_END / nyquist);

    let eLow = 0, eHiss = 0, eTot = 0;
    for (let i = 0; i < freqData.length; i++) {
      const v = freqData[i];
      eTot += v;
      if (i >= b200 && i < b1200) eLow += v;
      if (i >= b2000 && i < b6000) eHiss += v;
    }
    const lowR = eTot > 0 ? eLow / eTot : 0;
    const hissR = eTot > 0 ? eHiss / eTot : 0;

    // 3) 노이즈 바닥 + 동적 임계값
    const isSounding = rms > noiseFloorRef.current + AUDIO.SOUNDING_OFFSET;
    updateNoiseFloor(rms, isSounding);

    const QUIET = noiseFloorRef.current + AUDIO.QUIET_OFFSET;
    const LOUD = noiseFloorRef.current + AUDIO.LOUD_OFFSET;

    // 볼륨 콜백
    cbs.onVolume(rms, rms <= QUIET);

    // 4) 상태 판정
    let detected: MicState = 'idle';
    if (rms > LOUD && lowR > AUDIO.LOW_R_THRESHOLD) {
      detected = 'exhaling';
    } else if (hissR > AUDIO.HISS_THRESHOLD) {
      detected = 'inhaling';
    } else if (rms > QUIET * 3) {
      detected = 'inhaling';
    }

    // 5) 시간 기반 디바운싱
    const now = performance.now();
    if (detected !== pendingStateRef.current) {
      pendingStateRef.current = detected;
      pendingStartMsRef.current = now;
    }

    const holdMs = now - pendingStartMsRef.current;
    const debounceMs = detected === 'idle' ? AUDIO.DEBOUNCE_IDLE : AUDIO.DEBOUNCE_ACTIVE;

    if (holdMs >= debounceMs && lastMicStateRef.current !== detected) {
      const prevState = lastMicStateRef.current;
      lastMicStateRef.current = detected;
      cbs.onStateChange(detected, prevState);
    }

    // 후— 상태일 때 연기 계속 (콜백에서 처리하도록 rms 전달)
    // → onVolume에서 처리

    requestAnimationFrame(() => detectSound(doneRef));
  }, [getRMS, updateNoiseFloor]);

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

  const isActive = useCallback(() => activeRef.current, []);
  const getLastState = useCallback(() => lastMicStateRef.current, []);

  return { startMic, stopMic, isActive, getLastState };
}
