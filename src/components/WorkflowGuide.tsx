/**
 * Workflow Guidance Component
 * Provides step-by-step guidance for the audiobook creation process
 */

import React, { useEffect } from 'react';
import { useWorkflowStore, useStepInfo, useWorkflowProgress, WorkflowStep } from '@/stores/workflow';
import { CheckCircle2, Circle, ChevronRight, Loader2 } from 'lucide-react';

interface WorkflowGuideProps {
  className?: string;
  onStepClick?: (step: WorkflowStep) => void;
}

const STEP_ICONS: Record<WorkflowStep, React.ReactNode> = {
  upload: <UploadIcon />,
  create_project: <FolderOpenIcon />,
  generate_script: <FileTextIcon />,
  review_script: <EyeIcon />,
  configure_voice: <MicIcon />,
  create_chunks: <ScissorsIcon />,
  generate_audio: <Volume2Icon />,
  merge_audio: <MergeIcon />,
  export_audio: <DownloadIcon />,
  completed: <CheckCircle2 className="w-5 h-5 text-green-500" />,
};

export const WorkflowGuide: React.FC<WorkflowGuideProps> = ({
  className = '',
  onStepClick,
}) => {
  const { currentStep, completedSteps, getNextStep, canProceedToStep } = useWorkflowStore();
  const { completed, total, percentage } = useWorkflowProgress();

  const steps: WorkflowStep[] = [
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

  const nextStep = getNextStep();

  const handleStepClick = (step: WorkflowStep) => {
    if (canProceedToStep(step) && onStepClick) {
      onStepClick(step);
    }
  };

  return (
    <div className={`workflow-guide ${className}`}>
      {/* Overall Progress */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-900">总体进度</span>
          <span className="text-sm font-bold text-blue-600">{percentage}%</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-blue-700 mt-2">
          已完成 {completed} / {total} 个步骤
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const stepInfo = useStepInfo(step);
          const isCurrent = step === currentStep;
          const isCompleted = stepInfo.isCompleted;
          const canProceed = stepInfo.canProceed;

          return (
            <div
              key={step}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-blue-50 border-blue-300 shadow-sm'
                  : isCompleted
                  ? 'bg-green-50 border-green-200'
                  : canProceed
                  ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  : 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
              }`}
              onClick={() => handleStepClick(step)}
            >
              {/* Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                isCompleted ? 'bg-green-100' : isCurrent ? 'bg-blue-100' : 'bg-gray-200'
              }`}>
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  isCurrent ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-700'
                }`}>
                  {stepInfo.label}
                </p>
                <p className="text-xs text-gray-500 truncate">{stepInfo.description}</p>
              </div>

              {/* Chevron for current step */}
              {isCurrent && (
                <ChevronRight className="w-5 h-5 text-blue-500 animate-pulse" />
              )}

              {/* Step number */}
              {!isCurrent && !isCompleted && (
                <span className="text-xs font-medium text-gray-400">{index + 1}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Next Step Suggestion */}
      {nextStep && !completedSteps.has('completed') && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-medium text-amber-900 mb-1">建议下一步</p>
          <p className="text-xs text-amber-700">
            {useStepInfo(nextStep).description}
          </p>
        </div>
      )}

      {/* Completed State */}
      {completedSteps.has('completed') && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-900">项目已完成！</p>
          </div>
          <p className="text-xs text-green-700 mt-1">
            您的有声书已准备就绪，可以开始播放或导出。
          </p>
        </div>
      )}
    </div>
  );
};

// Icon components
function UploadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function FolderOpenIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function ScissorsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
    </svg>
  );
}

function Volume2Icon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );
}

function MergeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}
