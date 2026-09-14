'use client';

import { useEffect, useCallback } from 'react';

const DRAFT_KEY = 'hypertrophy_session_draft';

export interface SessionDraft {
  sessionId: string;
  planId?: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    sets: {
      id?: string;
      setNumber: number;
      weight: number;
      reps: number;
      rir: number | null;
      logged: boolean;
    }[];
  }[];
  startedAt: string;
}

export function useSessionDraft() {
  const save = useCallback((draft: SessionDraft) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // localStorage full or unavailable — fail silently
    }
  }, []);

  const load = useCallback((): SessionDraft | null => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SessionDraft;
    } catch {
      return null;
    }
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // fail silently
    }
  }, []);

  return { save, load, clear };
}
