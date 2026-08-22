import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Volume2, CheckCircle2 } from 'lucide-react';

interface VoiceRecorderProps {
  onAudioReady: (audioData: { url: string; duration: number; blob: Blob | null }) => void;
  initialAudioUrl?: string;
  initialDuration?: number;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onAudioReady,
  initialAudioUrl,
  initialDuration = 0,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Clean up audio elements and intervals
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, []);

  // Live waveform visualizer while recording
  const startVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!canvasRef.current || !analyserRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
          ctx.fillStyle = `rgb(${180 + dataArray[i] * 0.3}, ${80 + dataArray[i] * 0.4}, 30)`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }

        animationFrameRef.current = requestAnimationFrame(draw);
      };

      draw();
    } catch (err) {
      console.warn('Audio visualization not supported:', err);
    }
  };

  const startRecording = async () => {
    setPermissionError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          setAudioUrl(base64Data);
          setDuration(recordTime);
          onAudioReady({
            url: base64Data,
            duration: recordTime,
            blob: audioBlob,
          });
        };

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordTime(0);
      startVisualizer(stream);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      setPermissionError('Microphone permission required to record audio voice note.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;

    if (!audioElementRef.current) {
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;

      audio.ontimeupdate = () => {
        setPlaybackTime(Math.floor(audio.currentTime));
      };

      audio.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      };
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const resetRecording = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordTime(0);
    setPlaybackTime(0);
    setDuration(0);
    onAudioReady({ url: '', duration: 0, blob: null });
  };

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-3.5 rounded-xl parchment-subtle border border-amber-300/80">
      <div className="flex items-center justify-between mb-2.5">
        <label className="text-xs font-semibold text-amber-950 flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-amber-700" />
          Voice Message (Spoken Memory)
        </label>
        {audioUrl && !isRecording && (
          <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Audio Attached ({formatSecs(duration || recordTime)})
          </span>
        )}
      </div>

      {permissionError && (
        <div className="mb-2 p-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
          {permissionError}
        </div>
      )}

      {/* Recording State Controls */}
      {!audioUrl && !isRecording && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium transition shadow-xs cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5 text-amber-200" />
            Record Spoken Message
          </button>
          <span className="text-[11px] text-stone-500 italic">Capture real ambient sounds or greetings</span>
        </div>
      )}

      {isRecording && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span className="text-xs font-bold text-red-700 font-mono">
                RECORDING {formatSecs(recordTime)}
              </span>
            </div>
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-medium transition cursor-pointer"
            >
              <Square className="w-3 h-3" />
              Finish Recording
            </button>
          </div>
          <canvas
            ref={canvasRef}
            width={280}
            height={36}
            className="w-full h-9 bg-amber-950/10 rounded-md border border-amber-200"
          />
        </div>
      )}

      {/* Audio Playback Review */}
      {audioUrl && !isRecording && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlayback}
              className="w-8 h-8 rounded-full bg-amber-800 hover:bg-amber-900 text-amber-100 flex items-center justify-center transition shadow-xs cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 translate-x-0.5" />}
            </button>
            <div className="text-xs font-mono text-stone-700">
              {formatSecs(isPlaying ? playbackTime : 0)} / {formatSecs(duration || recordTime)}
            </div>
          </div>

          <button
            type="button"
            onClick={resetRecording}
            className="flex items-center gap-1 text-[11px] text-stone-600 hover:text-red-700 px-2 py-1 rounded transition hover:bg-red-50 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Re-record
          </button>
        </div>
      )}
    </div>
  );
};
