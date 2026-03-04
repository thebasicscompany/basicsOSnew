import { useState, useRef, useCallback, useEffect } from "react";
import { MIN_TRANSCRIPTION_BLOB_SIZE } from "../../shared-overlay/constants";
import { createOverlayLogger } from "./overlay-logger";
import { transcribeAudioBlob } from "../api";

const log = createOverlayLogger("whisper");

let audioCtx: AudioContext | null = null;

const playChime = (frequency: number, duration: number): void => {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = frequency;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + duration
    );
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // ignore
  }
};

const playStartChime = () => playChime(880, 0.15);
const playStopChime = () => playChime(440, 0.2);

/** Adaptive RMS-based VAD tuning constants. */
const VAD_POLL_MS = 60;
const VAD_CALIBRATION_MS = 350;
const VAD_MIN_SPEECH_MS = 180;
const VAD_NOISE_MARGIN = 0.004;
const VAD_MIN_THRESHOLD = 0.006;
const VAD_MAX_THRESHOLD = 0.04;
const VAD_INITIAL_NO_SPEECH_GRACE_MS = 2500;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const runVoiceActivityDetection = (
  stream: MediaStream,
  silenceTimeoutMs: number,
  onSilence: () => void
): (() => void) => {
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  source.connect(analyser);
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.6;
  const data = new Uint8Array(analyser.fftSize);

  const startedAt = Date.now();
  const calibrationSamples: number[] = [];
  const noSpeechGraceMs = Math.max(
    silenceTimeoutMs,
    VAD_INITIAL_NO_SPEECH_GRACE_MS
  );

  let threshold = VAD_MIN_THRESHOLD;
  let smoothedRms = 0;
  let speechCandidateAt: number | null = null;
  let lastConfirmedSpeechAt: number | null = null;
  let ended = false;
  let cancelled = false;

  const getRms = (): number => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i]! - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / data.length);
  };

  const finalizeCalibration = (): void => {
    if (calibrationSamples.length === 0) return;
    const avgNoise =
      calibrationSamples.reduce((acc, v) => acc + v, 0) /
      calibrationSamples.length;
    threshold = clamp(
      avgNoise * 2.1 + VAD_NOISE_MARGIN,
      VAD_MIN_THRESHOLD,
      VAD_MAX_THRESHOLD
    );
  };

  const triggerSilence = (): void => {
    if (ended || cancelled) return;
    ended = true;
    onSilence();
  };

  const poll = (): void => {
    if (cancelled || ended) return;

    const now = Date.now();
    const rms = getRms();
    smoothedRms = smoothedRms > 0 ? smoothedRms * 0.7 + rms * 0.3 : rms;

    if (now - startedAt <= VAD_CALIBRATION_MS) {
      calibrationSamples.push(smoothedRms);
    } else if (calibrationSamples.length > 0) {
      finalizeCalibration();
      calibrationSamples.length = 0;
    }

    const isVoice = smoothedRms >= threshold;

    if (isVoice) {
      if (speechCandidateAt === null) {
        speechCandidateAt = now;
      } else if (now - speechCandidateAt >= VAD_MIN_SPEECH_MS) {
        lastConfirmedSpeechAt = now;
      }
    } else {
      speechCandidateAt = null;
    }

    if (lastConfirmedSpeechAt !== null) {
      if (now - lastConfirmedSpeechAt >= silenceTimeoutMs) {
        triggerSilence();
        return;
      }
    } else if (now - startedAt >= noSpeechGraceMs) {
      triggerSilence();
      return;
    }

    setTimeout(poll, VAD_POLL_MS);
  };
  poll();

  return () => {
    cancelled = true;
    void ctx.close();
  };
};

export type SpeechRecognitionOptions = {
  onSilence?: () => void;
  silenceTimeoutMs?: number;
};

export type SpeechRecognitionState = {
  isListening: boolean;
  transcript: string;
  interimText: string;
  startListening: () => void;
  stopListening: () => Promise<string>;
};

export const useSpeechRecognition = (
  options?: SpeechRecognitionOptions
): SpeechRecognitionState => {
  const { onSilence, silenceTimeoutMs = 2000 } = options ?? {};
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const vadCleanupRef = useRef<(() => void) | null>(null);
  const stopPromiseRef = useRef<Promise<string> | null>(null);
  const listenSessionRef = useRef(0);

  useEffect(() => {
    return () => {
      vadCleanupRef.current?.();
      vadCleanupRef.current = null;
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    const sessionId = Date.now();
    listenSessionRef.current = sessionId;

    const existingRecorder = mediaRecorderRef.current;
    if (
      existingRecorder &&
      (existingRecorder.state === "recording" ||
        existingRecorder.state === "paused")
    ) {
      return;
    }

    playStartChime();
    setIsListening(true);
    setTranscript("");
    setInterimText("");
    chunksRef.current = [];
    vadCleanupRef.current?.();
    vadCleanupRef.current = null;

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      })
      .then((stream) => {
        if (listenSessionRef.current !== sessionId) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }

        streamRef.current = stream;
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onerror = () => {
          setIsListening(false);
          vadCleanupRef.current?.();
          vadCleanupRef.current = null;
          mediaRecorderRef.current = null;
          if (streamRef.current) {
            for (const track of streamRef.current.getTracks()) track.stop();
            streamRef.current = null;
          }
        };

        recorder.start();
        setInterimText("Recording...");

        if (onSilence && silenceTimeoutMs > 0) {
          vadCleanupRef.current = runVoiceActivityDetection(
            stream,
            silenceTimeoutMs,
            onSilence
          );
        }
      })
      .catch((err: unknown) => {
        if (listenSessionRef.current !== sessionId) return;
        const msg =
          err instanceof Error ? err.message : "Microphone access denied";
        log.error("getUserMedia failed:", msg);
        setIsListening(false);
        setInterimText(msg);
      });
  }, [onSilence, silenceTimeoutMs]);

  const stopMediaTracks = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
  }, []);

  const stopListening = useCallback(async (): Promise<string> => {
    if (stopPromiseRef.current) {
      return stopPromiseRef.current;
    }

    listenSessionRef.current = 0;

    const stopPromise = (async (): Promise<string> => {
      vadCleanupRef.current?.();
      vadCleanupRef.current = null;

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        mediaRecorderRef.current = null;
        setIsListening(false);
        playStopChime();
        stopMediaTracks();
        return "";
      }

      const blob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          const mimeType = recorder.mimeType || "audio/webm";
          resolve(new Blob(chunksRef.current, { type: mimeType }));
        };
        recorder.stop();
      });
      mediaRecorderRef.current = null;

      playStopChime();
      setIsListening(false);
      stopMediaTracks();
      setInterimText("Transcribing...");

      if (blob.size < MIN_TRANSCRIPTION_BLOB_SIZE) {
        setTranscript("");
        setInterimText("");
        return "";
      }

      let text = "";
      try {
        const result = await transcribeAudioBlob(blob);
        text = result ?? "";
      } catch (err) {
        log.error("Transcription error:", err);
      }
      setTranscript(text);
      setInterimText("");
      return text;
    })();

    stopPromiseRef.current = stopPromise;
    return stopPromise.finally(() => {
      stopPromiseRef.current = null;
    });
  }, [stopMediaTracks]);

  return { isListening, transcript, interimText, startListening, stopListening };
};
