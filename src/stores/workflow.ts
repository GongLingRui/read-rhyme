/**
 * Workflow State Store
 * Manages the complete audiobook creation workflow from upload to playback
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type WorkflowStep =
  | 'upload'           // Book uploaded
  | 'create_project'   // Project created
  | 'generate_script' // Script generated
  | 'review_script'   // Script reviewed
  | 'configure_voice' // Voice configured
  | 'create_chunks'   // Chunks created
  | 'generate_audio'  // Audio generating
  | 'merge_audio'     // Audio merged
  | 'export_audio'    // Audio exported
  | 'completed';      // All done

interface WorkflowState {
  currentStep: WorkflowStep;
  stepHistory: WorkflowStep[];
  projectId: string | null;
  bookId: string | null;
  scriptId: string | null;
  totalChunks: number;
  generatedChunks: number;
  failedChunks: number;
  audioUrl: string | null;
  isProcessing: boolean;
  lastError: string | null;

  // Step completion status
  completedSteps: Set<WorkflowStep>;

  // Actions
  setStep: (step: WorkflowStep) => void;
  completeStep: (step: WorkflowStep) => void;
  setProjectId: (id: string) => void;
  setBookId: (id: string) => void;
  setScriptId: (id: string) => void;
  setTotalChunks: (count: number) => void;
  updateChunkProgress: (generated: number, failed: number) => void;
  setAudioUrl: (url: string) => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: string) => void;
  clearError: () => void;
  reset: () => void;

  // Get next recommended step
  getNextStep: () => WorkflowStep | null;
  canProceedToStep: (step: WorkflowStep) => boolean;
  getStepProgress: () => { completed: number; total: number; percentage: number };
}

const STEP_ORDER: WorkflowStep[] = [
  'upload',
  'create_project',
  'generate_script',
  'review_script',
  'configure_voice',
  'create_chunks',
  'generate_audio',
  'merge_audio',
  'export_audio',
  'completed',
];

const STEP_LABELS: Record<WorkflowStep, string> = {
  upload: '上传书籍',
  create_project: '创建项目',
  generate_script: '生成脚本',
  review_script: '审查脚本',
  configure_voice: '配置语音',
  create_chunks: '创建分块',
  generate_audio: '生成音频',
  merge_audio: '合并音频',
  export_audio: '导出音频',
  completed: '已完成',
};

const STEP_DESCRIPTIONS: Record<WorkflowStep, string> = {
  upload: '上传您的电子书文件（TXT、PDF、EPUB）',
  create_project: '为有声书创建项目',
  generate_script: '使用AI生成叙述脚本',
  review_script: '审查并调整生成的脚本',
  configure_voice: '配置角色语音和情感',
  create_chunks: '将脚本分割为音频块',
  generate_audio: '生成所有音频（可能需要一些时间）',
  merge_audio: '合并所有音频块',
  export_audio: '导出最终有声书',
  completed: '您的有声书已完成！',
};

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 'upload',
      stepHistory: [],
      projectId: null,
      bookId: null,
      scriptId: null,
      totalChunks: 0,
      generatedChunks: 0,
      failedChunks: 0,
      audioUrl: null,
      isProcessing: false,
      lastError: null,
      completedSteps: new Set(),

      // Actions
      setStep: (step) => {
        const state = get();
        set({
          currentStep: step,
          stepHistory: [...state.stepHistory, step],
        });
      },

      completeStep: (step) => {
        set((state) => ({
          completedSteps: new Set([...state.completedSteps, step]),
        }));
      },

      setProjectId: (id) => set({ projectId: id }),
      setBookId: (id) => set({ bookId: id }),
      setScriptId: (id) => set({ scriptId: id }),

      setTotalChunks: (count) => set({ totalChunks: count }),

      updateChunkProgress: (generated, failed) => {
        set({
          generatedChunks: generated,
          failedChunks: failed,
        });
      },

      setAudioUrl: (url) => set({ audioUrl: url }),

      setProcessing: (processing) => set({ isProcessing: processing }),

      setError: (error) => set({ lastError: error }),

      clearError: () => set({ lastError: null }),

      reset: () =>
        set({
          currentStep: 'upload',
          stepHistory: [],
          projectId: null,
          bookId: null,
          scriptId: null,
          totalChunks: 0,
          generatedChunks: 0,
          failedChunks: 0,
          audioUrl: null,
          isProcessing: false,
          lastError: null,
          completedSteps: new Set(),
        }),

      getNextStep: () => {
        const state = get();
        const currentIndex = STEP_ORDER.indexOf(state.currentStep);
        if (currentIndex < STEP_ORDER.length - 1) {
          return STEP_ORDER[currentIndex + 1];
        }
        return null;
      },

      canProceedToStep: (step) => {
        const state = get();
        const stepIndex = STEP_ORDER.indexOf(step);

        // Check if all previous steps are completed
        for (let i = 0; i < stepIndex; i++) {
          if (!state.completedSteps.has(STEP_ORDER[i])) {
            return false;
          }
        }
        return true;
      },

      getStepProgress: () => {
        const state = get();
        const total = STEP_ORDER.length;
        const completed = state.completedSteps.size;
        return {
          completed,
          total,
          percentage: Math.round((completed / total) * 100),
        };
      },
    }),
    {
      name: 'workflow-storage',
      partialize: (state) => ({
        projectId: state.projectId,
        bookId: state.bookId,
        completedSteps: Array.from(state.completedSteps),
      }),
    }
  )
);

// Helper hooks
export const useWorkflowProgress = () => {
  const { getStepProgress, currentStep, completedSteps } = useWorkflowStore();
  return { ...getStepProgress(), currentStep, completedSteps };
};

export const useStepInfo = (step: WorkflowStep) => {
  const { completedSteps, canProceedToStep } = useWorkflowStore();

  return {
    label: STEP_LABELS[step],
    description: STEP_DESCRIPTIONS[step],
    isCompleted: completedSteps.has(step),
    canProceed: canProceedToStep(step),
  };
};
