import React, { useState, useMemo } from 'react';
import { BusinessRecord, CandidateResult } from '../types';
import { BENCHMARK_CASES } from '../data/sampleDataset';
import { clean, nameTokens, addressTokens, skeleton } from '../lib/normalize';
import { buildBlockingIndex } from '../lib/blocking';
import { resolveEntity } from '../lib/matcher';
import { f05Entity } from '../lib/metrics';
import { FeaturesTable } from './FeaturesTable';
import { PipelineVisualizer } from './PipelineVisualizer';
import { Check, X, AlertTriangle, ChevronRight, Sliders } from 'lucide-react';

export const EntityMatcherStudio: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(BENCHMARK_CASES[0].id);
  const [activeStep, setActiveStep] = useState<number>(3);
  const [threshold, setThreshold] = useState<number>(0.675);
  const [keepMax, setKeepMax] = useState<number>(10);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResult | null>(null);

  // Editable fields for custom experimentation
  const currentCase = useMemo(
    () => BENCHMARK_CASES.find((c) => c.id === selectedCaseId) || BENCHMARK_CASES[0],
    [selectedCaseId]
  );

  const [s1Name, setS1Name] = useState<string>(currentCase.s1.name);
  const [s1Address, setS1Address] = useState<string>(currentCase.s1.address);
  const [s1Country, setS1Country] = useState<string>(currentCase.s1.country);

  // When switching benchmark case, reset input fields
  const handleCaseChange = (caseId: string) => {
    setSelectedCaseId(caseId);
    const targetCase = BENCHMARK_CASES.find((c) => c.id === caseId) || BENCHMARK_CASES[0];
    setS1Name(targetCase.s1.name);
    setS1Address(targetCase.s1.address);
    setS1Country(targetCase.s1.country);
    setSelectedCandidate(null);
  };

  // Build blocking index on the current pool
  const blockingIndex = useMemo(() => {
    return buildBlockingIndex(currentCase.pool);
  }, [currentCase]);

  // Construct current S1 Record
  const currentS1Record: BusinessRecord = useMemo(
    () => ({
      id: currentCase.s1.id,
      source: 'S1',
      name: s1Name,
      address: s1Address,
      country: s1Country as any,
    }),
    [currentCase.s1.id, s1Name, s1Address, s1Country]
  );

  // Execute pipeline
  const resolutionResult = useMemo(() => {
    return resolveEntity(currentS1Record, blockingIndex, currentCase.groundTruthMatches, {
      decisionThreshold: threshold,
      keepMaxCandidates: keepMax,
      minRerankProb: 0.005,
    });
  }, [currentS1Record, blockingIndex, currentCase.groundTruthMatches, threshold, keepMax]);

  // Calculate local F0.5
  const scoreMetrics = useMemo(() => {
    return f05Entity(resolutionResult.matchedIds, currentCase.groundTruthMatches);
  }, [resolutionResult.matchedIds, currentCase.groundTruthMatches]);

  // Normalization details for Stage 0 inspection
  const normS1 = useMemo(() => {
    const cleaned = clean(s1Name);
    const tokens = nameTokens(s1Name);
    const skels = tokens.map((t) => skeleton(t) || t);
    const addrToks = addressTokens(s1Address);
    return { cleaned, tokens, skels, addrToks };
  }, [s1Name, s1Address]);

  return (
    <div className="space-y-6">
      {/* Benchmark Presets Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Challenge Benchmark Test Cases</span>
              <span className="text-xs font-normal text-slate-400">
                (Real patterns from Amazon ML Challenge)
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{currentCase.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Select Preset:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => handleCaseChange(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {BENCHMARK_CASES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category} - {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pipeline stage navigator */}
        <PipelineVisualizer currentStep={activeStep} onStepClick={setActiveStep} />
      </div>

      {/* Main Studio Grid: Left = S1 + Controls, Right = Candidates & Decision */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: S1 Source Record & Model Hyperparameters */}
        <div className="lg:col-span-5 space-y-4">
          {/* S1 Entity Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-xs font-bold">
                  {currentS1Record.id}
                </span>
                <span className="text-xs font-semibold text-slate-200">Source 1 Master Entity</span>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Country: {currentS1Record.country}
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Business Name</label>
                <input
                  type="text"
                  value={s1Name}
                  onChange={(e) => setS1Name(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Business Address</label>
                <textarea
                  rows={2}
                  value={s1Address}
                  onChange={(e) => setS1Address(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono resize-none"
                />
              </div>
            </div>

            {/* Stage 0 Inspection (Always Visible) */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 text-xs space-y-1.5">
              <div className="text-[11px] font-semibold text-amber-400 flex items-center justify-between">
                <span>Stage 0 Normalized Representation</span>
                <span className="text-[10px] text-slate-400 font-normal">normalize.py</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-start gap-1">
                  <span className="text-slate-400 shrink-0">Tokens:</span>
                  <span className="text-slate-300 font-mono break-all">
                    [{normS1.tokens.join(', ')}]
                  </span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="text-slate-400 shrink-0">Phonetic Skeletons:</span>
                  <span className="text-purple-300 font-mono break-all">
                    [{normS1.skels.join(', ')}]
                  </span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="text-slate-400 shrink-0">Address Tokens:</span>
                  <span className="text-emerald-300 font-mono break-all">
                    [{normS1.addrToks.join(', ')}]
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hyperparameters / Threshold Tuning */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white border-b border-slate-800 pb-2">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Pipeline Decision Thresholds</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Match Probability Threshold:</span>
                  <span className="font-mono font-bold text-amber-400">{threshold.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="0.90"
                  step="0.005"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>0.30 (High Recall)</span>
                  <span className="text-amber-400/80 font-semibold">0.675 (Competition Tuned)</span>
                  <span>0.90 (High Precision)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Max Kept Candidates (candidate_pairs.tsv):</span>
                  <span className="font-mono font-bold text-blue-400">{keepMax}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="1"
                  value={keepMax}
                  onChange={(e) => setKeepMax(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>3</span>
                  <span>10 (Default)</span>
                  <span>15</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time F0.5 Score on this Entity */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">Entity Scoring Metric</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                F0.5: {scoreMetrics.f05.toFixed(4)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Precision (2x wt)</span>
                <span className="font-mono font-semibold text-white">
                  {(scoreMetrics.precision * 100).toFixed(1)}%
                </span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Recall</span>
                <span className="font-mono font-semibold text-white">
                  {(scoreMetrics.recall * 100).toFixed(1)}%
                </span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px] block">True Positives</span>
                <span className="font-mono font-semibold text-white">
                  {scoreMetrics.tp} / {currentCase.groundTruthMatches.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Candidate Pool & Decision Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                  Candidate Records Evaluation (Stage 1 & 2 Pool)
                </h3>
                <p className="text-[11px] text-slate-400">
                  {resolutionResult.candidates.length} candidates evaluated against S1
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="w-3.5 h-3.5" /> {resolutionResult.matchedIds.length} Matched
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <X className="w-3.5 h-3.5" />{' '}
                  {resolutionResult.candidates.length - resolutionResult.matchedIds.length} Rejected
                </span>
              </div>
            </div>

            {/* Candidates List */}
            <div className="space-y-2">
              {resolutionResult.candidates.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No candidates passed blocking filters.
                </div>
              ) : (
                resolutionResult.candidates.map((cand) => {
                  const isMatch = cand.status === 'MATCHED';
                  const isGT = cand.isGroundTruthMatch;
                  const isSelected = selectedCandidate?.s2s3Record.id === cand.s2s3Record.id;

                  return (
                    <div
                      key={cand.s2s3Record.id}
                      onClick={() => setSelectedCandidate(isSelected ? null : cand)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/20'
                          : isMatch
                          ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/70'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                cand.s2s3Record.source === 'S2'
                                  ? 'bg-indigo-500/20 text-indigo-300'
                                  : 'bg-teal-500/20 text-teal-300'
                              }`}
                            >
                              {cand.s2s3Record.id} ({cand.s2s3Record.source})
                            </span>
                            <span className="text-xs font-semibold text-slate-100 truncate">
                              {cand.s2s3Record.name}
                            </span>
                            {isGT && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium">
                                Ground Truth
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            {cand.s2s3Record.address || '(No address provided)'}
                          </p>
                        </div>

                        {/* Status Badge & Probabilities */}
                        <div className="text-right shrink-0">
                          <div className="flex items-center justify-end gap-1.5 mb-1">
                            {isMatch ? (
                              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <Check className="w-3 h-3" /> MATCH
                              </span>
                            ) : cand.status === 'REJECTED_SIBLING' ? (
                              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                <AlertTriangle className="w-3 h-3" /> SIBLING DECOY
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                <X className="w-3 h-3" /> REJECTED
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Match Prob:{' '}
                            <span className="text-amber-400 font-bold">
                              {(cand.matchProbability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Rejection Reason or Quick Features */}
                      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-3">
                          <span>Block Score: <strong className="text-slate-200">{cand.blockingScore}</strong></span>
                          <span>Name JW: <strong className="text-slate-200">{cand.features.name_jw}</strong></span>
                          <span>Addr Set: <strong className="text-slate-200">{cand.features.addr_token_set}</strong></span>
                          <span>Shared Nums: <strong className="text-slate-200">{cand.features.num_shared}</strong></span>
                        </div>
                        <div className="text-[10px] text-amber-400 flex items-center gap-0.5">
                          <span>{isSelected ? 'Hide Features' : 'Inspect 26 Features'}</span>
                          <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      {/* Rejection note */}
                      {cand.rejectionReason && (
                        <div className="mt-1.5 text-[10px] text-rose-400/90 bg-rose-500/5 px-2 py-1 rounded">
                          {cand.rejectionReason}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 26-Feature Deep Inspection Drawer */}
          {selectedCandidate && (
            <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 shadow-lg shadow-amber-500/5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Feature Vector Inspector:</span>
                    <span className="font-mono text-amber-400">{selectedCandidate.s2s3Record.id}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Pair features computed for LightGBM matcher inference
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <FeaturesTable
                features={selectedCandidate.features}
                candidateId={selectedCandidate.s2s3Record.id}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
