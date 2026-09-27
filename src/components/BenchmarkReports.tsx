import React from 'react';
import {
  COMPETITION_OVERVIEW,
  ITERATION_10PCT_BENCHMARK,
  BLOCKING_EXPERIMENTS,
  CANDIDATE_SIZE_EXPERIMENTS,
  IMPROVEMENT_MILESTONES,
} from '../data/reportsData';
import { BarChart3, TrendingUp, Filter, Layers, CheckCircle2, Award, Zap } from 'lucide-react';

export const BenchmarkReports: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Team Null-Pointers &bull; Entity Resolution High-Precision Engine
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Iterative optimization logs on 10% stratified benchmark achieving <span className="text-emerald-400 font-semibold font-mono">0.9933 Macro F0.5</span> (target range: <span className="text-amber-400 font-mono">0.991 - 0.995</span>).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-4 py-2 rounded-lg border border-emerald-500/30 text-right">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold block flex items-center gap-1 justify-end">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" /> Target Reached
              </span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {COMPETITION_OVERVIEW.finalValidationF05.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Target Range</span>
            <span className="text-base font-bold text-amber-400 font-mono">0.991 &ndash; 0.995</span>
            <span className="text-[10px] text-emerald-400 block font-semibold">&check; 0.9933 achieved</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Singletons Score</span>
            <span className="text-base font-bold text-emerald-400 font-mono">1.0000 F0.5</span>
            <span className="text-[10px] text-slate-500 block">Zero false positive singletons</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Matched Entities</span>
            <span className="text-base font-bold text-cyan-400 font-mono">0.9928 F0.5</span>
            <span className="text-[10px] text-slate-500 block">Global bipartite resolved</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Test Countries</span>
            <span className="text-base font-bold text-white font-mono">US, India, France</span>
            <span className="text-[10px] text-slate-500 block">Dual-threshold ensemble</span>
          </div>
        </div>
      </div>

      {/* 10% Dataset Iteration Loop Progression */}
      <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              10% Dataset Iterative Optimization Loop (Target 0.991 &ndash; 0.995)
            </h3>
          </div>
          <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono font-medium">
            Active Model: Iter 6 (0.9933)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">Iter</th>
                <th className="py-2.5 px-3">Configuration & Key Innovation</th>
                <th className="py-2.5 px-3 text-right">Singletons F0.5</th>
                <th className="py-2.5 px-3 text-right">Matched F0.5</th>
                <th className="py-2.5 px-3 text-right">Macro F0.5</th>
                <th className="py-2.5 px-3 text-center">Target Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {ITERATION_10PCT_BENCHMARK.map((row) => (
                <tr
                  key={row.iter}
                  className={`transition-colors ${
                    row.status === 'optimal'
                      ? 'bg-emerald-950/20 border-l-2 border-emerald-500 font-medium'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-300">
                    {row.iter}
                  </td>
                  <td className="py-2.5 px-3 text-slate-200">
                    <span className="font-semibold">{row.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                    {row.singletons.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                    {row.matched.toFixed(4)}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-mono font-bold ${
                      row.macroF05 >= 0.991 ? 'text-emerald-400 text-sm' : 'text-amber-400'
                    }`}
                  >
                    {row.macroF05.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.macroF05 >= 0.991 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-semibold border border-emerald-500/30">
                        &check; In Range
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        Iterating...
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Improvement Milestones Table (v2 to v6) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Model Improvement Milestones (v2 &rarr; v6 Solution)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Iteration / Change</th>
                <th className="py-2.5 px-3">Description & Impact</th>
                <th className="py-2.5 px-3 text-right">Validation Macro F0.5</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {IMPROVEMENT_MILESTONES.map((m, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{m.version}</td>
                  <td className="py-2.5 px-3 text-slate-400">{m.description}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                    {m.f05.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blocking & Candidate Size Experiments Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blocking Experiments */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Stage 1 Blocking Experiments
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-2.5">Setup</th>
                  <th className="py-2 px-2.5">K=10</th>
                  <th className="py-2 px-2.5">K=50</th>
                  <th className="py-2 px-2.5">K=100</th>
                  <th className="py-2 px-2.5">Pair Recall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {BLOCKING_EXPERIMENTS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2 px-2.5 font-sans text-slate-300 font-medium">
                      {row.setup}
                    </td>
                    <td className="py-2 px-2.5 text-slate-400">{row.k10}</td>
                    <td className="py-2 px-2.5 text-slate-400">{row.k50}</td>
                    <td className="py-2 px-2.5 text-slate-400">{row.k100}</td>
                    <td className="py-2 px-2.5 text-emerald-400 font-bold">{row.recall}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Candidate Size Experiments */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Stage 2 Candidate Set Size Tuning
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-2.5">Method</th>
                  <th className="py-2 px-2.5">Cands/Entity</th>
                  <th className="py-2 px-2.5">Pair Recall</th>
                  <th className="py-2 px-2.5">Model F0.5</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {CANDIDATE_SIZE_EXPERIMENTS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2 px-2.5 font-sans text-slate-300 font-medium">
                      {row.method}
                    </td>
                    <td className="py-2 px-2.5 text-purple-300">{row.candsPerEntity.toFixed(2)}</td>
                    <td className="py-2 px-2.5 text-slate-400">{(row.pairRecall * 100).toFixed(1)}%</td>
                    <td className="py-2 px-2.5 text-amber-400 font-bold">{row.modelF05.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
