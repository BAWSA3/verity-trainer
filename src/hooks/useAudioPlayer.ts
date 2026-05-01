'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Single-element HTMLAudio player for background music. Distinct from the
// Web Audio SFX in src/lib/sounds.ts — that handles short blips, this handles
// long looping music. Tracks are loaded from public/audio/manifest.json.
//
// First play requires a user gesture (autoplay policy). The Console screen's
// ♪ toggle in the header is that gesture.

export interface Track {
  id: string;
  title: string;
  src: string;
  durationSec?: number;
}

interface AudioManifest {
  tracks: Track[];
}

interface PersistedState {
  enabled: boolean;
  volume: number;
  currentTrackId: string | null;
  position: number;
}

const STORAGE_KEY = 'verity:audio:v1';

function loadPersisted(): PersistedState {
  if (typeof window === 'undefined') {
    return { enabled: false, volume: 0.5, currentTrackId: null, position: 0 };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { enabled: false, volume: 0.5, currentTrackId: null, position: 0 };
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      enabled: Boolean(parsed.enabled),
      volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(1, parsed.volume)) : 0.5,
      currentTrackId: typeof parsed.currentTrackId === 'string' ? parsed.currentTrackId : null,
      position: typeof parsed.position === 'number' ? parsed.position : 0,
    };
  } catch {
    return { enabled: false, volume: 0.5, currentTrackId: null, position: 0 };
  }
}

function persist(state: PersistedState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function useAudioPlayer() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [trackIdx, setTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.5);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load manifest + restore persisted state.
  useEffect(() => {
    const persisted = loadPersisted();
    setVolumeState(persisted.volume);

    let cancelled = false;
    fetch('/audio/manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: AudioManifest | null) => {
        if (cancelled || !data?.tracks?.length) return;
        setTracks(data.tracks);
        // Resume from persisted track if it still exists.
        if (persisted.currentTrackId) {
          const idx = data.tracks.findIndex((t) => t.id === persisted.currentTrackId);
          if (idx >= 0) setTrackIdx(idx);
        }
      })
      .catch(() => { /* keep empty */ });
    return () => { cancelled = true; };
  }, []);

  // Initialize audio element when track changes.
  useEffect(() => {
    if (typeof window === 'undefined' || tracks.length === 0) return;
    const track = tracks[trackIdx];
    if (!track) return;

    // Tear down previous audio element.
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    const audio = new Audio(track.src);
    audio.loop = false;
    audio.volume = volume;
    audio.preload = 'auto';

    const onTime = () => setPosition(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || track.durationSec || 0);
    const onEnded = () => {
      // Auto-advance to next track.
      setTrackIdx((i) => (i + 1) % tracks.length);
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnded);

    audioRef.current = audio;

    // If we're supposed to be playing, start the new track.
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, trackIdx]);

  // Apply volume changes.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Persist state on changes.
  useEffect(() => {
    const current = tracks[trackIdx];
    persist({
      enabled: isPlaying,
      volume,
      currentTrackId: current?.id ?? null,
      position,
    });
  }, [isPlaying, volume, trackIdx, tracks, position]);

  const play = useCallback(async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn('[audio] play blocked:', err);
      setIsPlaying(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const next = useCallback(() => {
    if (tracks.length === 0) return;
    setTrackIdx((i) => (i + 1) % tracks.length);
  }, [tracks.length]);

  const prev = useCallback(() => {
    if (tracks.length === 0) return;
    setTrackIdx((i) => (i - 1 + tracks.length) % tracks.length);
  }, [tracks.length]);

  const seek = useCallback((sec: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, sec));
      setPosition(audioRef.current.currentTime);
    }
  }, [duration]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)));
  }, []);

  return {
    tracks,
    currentTrack: tracks[trackIdx] ?? null,
    isPlaying,
    position,
    duration,
    volume,
    play,
    pause,
    toggle,
    next,
    prev,
    seek,
    setVolume,
  };
}
