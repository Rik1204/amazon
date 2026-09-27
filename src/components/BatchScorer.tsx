import React, { useState, useMemo } from 'react';
import { BENCHMARK_CASES, GLOBAL_POOL_RECORDS } from '../data/sampleDataset';
import { buildBlockingIndex } from '../lib/blocking';
import { resolveEntity, resolveOwnerCompetition } from '../lib/matcher';
import { computeScoreReport } from '../lib/metrics';
import { Calculator, Sliders } from 'lucide-react';

export const BatchScorer: React.FC = () => {
  const [threshold, setThreshold] = useState<number>(0.675);
  const [enableCompetition, setEnableCompetition] = useState<boolean>(true);

  // Build blocking index for the global pool
  const blockingIndex = useMemo(() => {
    return buildBlockingIndex(GLOBAL_POOL_RECORDS);
  }, []);

  // Run resolution on all benchmark cases
  const { report, entityResults } = useMemo(() => {
    let outputs = BENCHMARK_CASES.map((bCase) => {
      return resolveEntity(bCase.s1, blockingIndex, bCase.groundTruthMatches, {
        decisionThreshold: threshold,
        keepMaxCandidates: 10,
        minRerankProb: 0.005,
      });
    });

    if (enableCompetition) {
      outputs = resolveOwnerCompetition(outputs);
    }

    const predictions: Record<string, string[]> = {};
    const truth: Record<string, string[]> = {};

    BENCHMARK_CASES.forEach((bCase, i) => {
      truth[bCase.s1.id] = bCase.groundTruthMatches;
      predictions[bCase.s1.id] = outputs[i].matchedIds;
    });

    const scoreReport = computeScoreReport(predictions, truth);

    return {
      report: scoreReport,
      entityResults: outputs,
    };
  }, [blockingIndex, threshold, enableCompetition]);

  return (
    <div className="space-y-6">
      {/* Header & Metrics Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-white">
                Official Macro F0.5 Competition Scorer
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Amazon ML Challenge macro-averaged metric across Source 1 entities with precision weighted twice as much as recall ($F_{0.5}$). Includes exact singleton rules (empty true set = 1.0 if predicted empty, else 0.0).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Macro F0.5 Score
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {report.macroF05.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* 4-Stat Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Macro Precision (2x wt)</span>
            <span className="text-lg font-bold text-white font-mono">
              {(report.meanPrecision * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Penalizes false positives</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Macro Recall</span>
            <span className="text-lg font-bold text-white font-mono">
              {(report.meanRecall * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Coverage of true pairs</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Singletons F0.5</span>
            <span className="text-lg font-bold text-purple-400 font-mono">
              {report.f05Singletons !== undefined ? report.f05Singletons.toFixed(4) : 'N/A'}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {report.singletonsCount} entities (empty GT)
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Matched Entities F0.5</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">
              {report.f05Matched !== undefined ? report.f05Matched.toFixed(4) : 'N/A'}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {report.matchedCount} entities with pairs
            </span>
          </div>
        </div>
      </div>

      {/* Threshold & Multi-Owner Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
            <span className="font-semibold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> Decision Cutoff Threshold:
            </span>
            <span className="font-mono font-bold text-amber-400">{threshold.toFixed(3)}</span>
          </div>
          <input
            type="range"
            min="0.30"
            max="0.85"
            step="0.005"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>0.30</span>
            <span className="text-amber-400/90 font-semibold">0.675 (Optimum)</span>
            <span>0.85</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <input
              type="checkbox"
              checked={enableCompetition}
              onChange={(e) => setEnableCompetition(e.target.checked)}
              className="accent-amber-500 rounded cursor-pointer"
            />
            <span>Enable Multi-Owner Conflict Solver (1 owner per record)</span>
          </label>
        </div>
      </div>

      {/* Detailed Entity-by-Entity Score Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white tracking-wide uppercase">
          Entity Scoring Breakdown & Ground Truth Alignment
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">S1 Entity</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Predicted Matches</th>
                <th className="py-2.5 px-3">Ground Truth</th>
                <th className="py-2.5 px-3">Precision</th>
                <th className="py-2.5 px-3">Recall</th>
                <th className="py-2.5 px-3 text-right">F0.5 Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {report.entityScores.map((score, idx) => {
                const bCase = BENCHMARK_CASES[idx];
                const perfect = score.f05 >= 0.999;

                return (
                  <tr key={score.s1Id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-200">{score.s1Id}</div>
                      <div className="text-[10px] text-slate-400 font-sans truncate max-w-[160px]">
                        {bCase?.s1.name}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {bCase?.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {score.predicted.length === 0 ? (
                        <span className="text-slate-500 italic font-sans">[None / Empty]</span>
                      ) : (
                        score.predicted.join(', ')
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {score.trueMatches.length === 0 ? (
                        <span className="text-purple-400 italic font-sans">[None (Singleton)]</span>
                      ) : (
                        score.trueMatches.join(', ')
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {(score.precision * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {(score.recall * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          perfect
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : score.f05 > 0.5
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {score.f05.toFixed(4)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
