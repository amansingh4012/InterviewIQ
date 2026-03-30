import { create } from 'zustand';
import { ParsedResume, Report } from '@/types';

interface InterviewStore {
  resumeId: string | null;
  parsedResume: ParsedResume | null;
  sessionId: string | null;
  currentQuestion: string | null;
  questionNumber: number;
  conversationHistory: Array<{ question: string; answer: string; score?: number }>;
  isRecording: boolean;
  isAudioPlaying: boolean;
  isLoading: boolean;
  report: Report | null;
  
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
  reset: () => void;
}

export const useInterviewStore = create<InterviewStore>((set) => ({
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
  reset: () => set({
    sessionId: null,
    currentQuestion: null,
    questionNumber: 0,
    conversationHistory: [],
    isRecording: false,
    isAudioPlaying: false,
    isLoading: false,
    report: null
  })
}));
