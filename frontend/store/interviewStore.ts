import { create } from 'zustand';
import { ParsedResume, Report } from '@/types';

/**
 * Interview Store
 * 
 * Security Note: This store intentionally does NOT persist to localStorage.
 * Sensitive data like parsedResume and conversationHistory should not be
 * stored in browser storage. Data is fetched from the server as needed.
 */
interface InterviewStore {
  // Session identifiers (safe to store temporarily in memory)
  resumeId: string | null;
  sessionId: string | null;
  
  // Current interview state (memory only, not persisted)
  parsedResume: ParsedResume | null;
  currentQuestion: string | null;
  questionNumber: number;
  conversationHistory: Array<{ question: string; answer: string; score?: number }>;
  report: Report | null;
  
  // UI state
  isRecording: boolean;
  isAudioPlaying: boolean;
  isLoading: boolean;
  
  // Actions
  setResumeId: (id: string) => void;
  setParsedResume: (resume: ParsedResume) => void;
  setSessionId: (id: string) => void;
  setCurrentQuestion: (q: string) => void;
  setQuestionNumber: (n: number) => void;
  addToHistory: (entry: { question: string; answer: string; score?: number }) => void;
  setIsRecording: (val: boolean) => void;
  setIsAudioPlaying: (val: boolean) => void;
  setIsLoading: (val: boolean) => void;
  setReport: (report: Report) => void;
  
  // Reset all state (call on logout or session end)
  reset: () => void;
  
  // Clear sensitive data only (preserves UI state)
  clearSensitiveData: () => void;
}

const initialState = {
  resumeId: null,
  parsedResume: null,
  sessionId: null,
  currentQuestion: null,
  questionNumber: 0,
  conversationHistory: [],
  isRecording: false,
  isAudioPlaying: false,
  isLoading: false,
  report: null,
};

export const useInterviewStore = create<InterviewStore>((set) => ({
  ...initialState,
  
  setResumeId: (id) => set({ resumeId: id }),
  setParsedResume: (resume) => set({ parsedResume: resume }),
  setSessionId: (id) => set({ sessionId: id }),
  setCurrentQuestion: (q) => set({ currentQuestion: q }),
  setQuestionNumber: (n) => set({ questionNumber: n }),
  addToHistory: (entry) => set((state) => ({
    conversationHistory: [...state.conversationHistory, entry]
  })),
  setIsRecording: (val) => set({ isRecording: val }),
  setIsAudioPlaying: (val) => set({ isAudioPlaying: val }),
  setIsLoading: (val) => set({ isLoading: val }),
  setReport: (report) => set({ report }),
  
  // Full reset - clears everything
  reset: () => set(initialState),
  
  // Clear only sensitive data, keep session identifiers for recovery
  clearSensitiveData: () => set({
    parsedResume: null,
    conversationHistory: [],
    report: null,
  })
}));

// Security: Clear sensitive data when tab is closed or hidden for extended period
if (typeof window !== 'undefined') {
  let hiddenTime: number | null = null;
  const CLEAR_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
  
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenTime = Date.now();
    } else if (hiddenTime && Date.now() - hiddenTime > CLEAR_THRESHOLD_MS) {
      // Tab was hidden for more than 30 minutes, clear sensitive data
      useInterviewStore.getState().clearSensitiveData();
    }
  });
}
