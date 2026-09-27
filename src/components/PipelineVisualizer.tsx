import React from 'react';
import { Sparkles, Filter, Layers, CheckCircle2 } from 'lucide-react';

interface PipelineVisualizerProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({ currentStep, onStepClick }) => {
  const steps = [
    {
      num: 0,
      title: '0. Normalization',
      sub: 'Acronyms, Translit & Skeletons',
      desc: 'clean(), unidecode, "S.A.S." -> "SAS", phonetic skeleton "prvt"',
      icon: Sparkles,
      color: 'amber',
    },
    {
      num: 1,
      title: '1. Rare-Key Blocking',
      sub: 'Inverted Index & Cosine',
      desc: 'Keys n:, k:, p:, c:, a:, b: with IDF, max_df cutoff, Top 50',
      icon: Filter,
      color: 'blue',
    },
    {
      num: 2,
      title: '2. Pair Re-Ranking',
      sub: '26 Features & Cut <= 10',
      desc: 'LightGBM model on string, address & house numbers, prob >= 0.005',
      icon: Layers,
      color: 'purple',
    },
    {
      num: 3,
      title: '3. Matcher & Competition',
      sub: 'Macro F0.5 Threshold',
      desc: 'Threshold 0.675, Sibling decoy filter, 1-owner competition',
      icon: CheckCircle2,
      color: 'emerald',
    },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.num;
          return (
            <button
              key={s.num}
              onClick={() => onStepClick && onStepClick(s.num)}
              className={`text-left p-3 rounded-lg border transition-all text-xs cursor-pointer ${
                isActive
                  ? 'border-amber-500 bg-amber-500/10 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                    isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-slate-200">{s.title}</span>
              </div>
              <p className="text-[11px] font-medium text-amber-400/90 mb-0.5">{s.sub}</p>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">{s.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
