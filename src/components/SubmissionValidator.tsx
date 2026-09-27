import React, { useState, useMemo } from 'react';
import { validateSubmission, ValidationResult } from '../lib/validator';
import { BENCHMARK_CASES } from '../data/sampleDataset';
import { FileCheck, AlertCircle, CheckCircle2, Download, RefreshCw, FileText } from 'lucide-react';

export const SubmissionValidator: React.FC = () => {
  // Pre-fill with a valid sample generated from our benchmark cases
  const defaultMatchingTsv = useMemo(() => {
    let tsv = 'source1_entity_id\tmatched_entity_ids\n';
    BENCHMARK_CASES.forEach((bCase) => {
      tsv += `${bCase.s1.id}\t${bCase.groundTruthMatches.join(' ')}\n`;
    });
    return tsv;
  }, []);

  const defaultCandidateTsv = useMemo(() => {
    let tsv = 'source1_entity_id\tcandidate_entity_ids\n';
    BENCHMARK_CASES.forEach((bCase) => {
      const allPoolIds = bCase.pool.map((p) => p.id).join(' ');
      tsv += `${bCase.s1.id}\t${allPoolIds}\n`;
    });
    return tsv;
  }, []);

  const [matchingTsv, setMatchingTsv] = useState<string>(defaultMatchingTsv);
  const [candidateTsv, setCandidateTsv] = useState<string>(defaultCandidateTsv);

  const validationResult: ValidationResult = useMemo(() => {
    return validateSubmission(matchingTsv, candidateTsv);
  }, [matchingTsv, candidateTsv]);

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadCorruptedSample = () => {
    // Inject typical student errors (comma separation, missing header, duplicate entity)
    const broken =
      'source1_entity_id,matched_entity_ids\n' +
      'S1-IN-10041\tS2-IN-90123, S3-IN-84512\n' +
      'S1-IN-10041\tS2-IN-90123\n' +
      'S1-US-40291\tS2-US-77124\tEXTRA_COLUMN\n';
    setMatchingTsv(broken);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-white">
                Official Submission File Validator
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Implements <code className="text-amber-400 font-mono">validate_submission.py</code> to ensure submission files are 100% compliant with the Amazon ML evaluation server format.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMatchingTsv(defaultMatchingTsv);
                setCandidateTsv(defaultCandidateTsv);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Valid
            </button>
            <button
              onClick={loadCorruptedSample}
              className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5" /> Test Corrupted
            </button>
          </div>
        </div>

        {/* Validation Status Banner */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            validationResult.isValid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {validationResult.isValid ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          )}

          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider">
              {validationResult.isValid
                ? 'PASSED — Submission Files Safe for Leaderboard'
                : `FAILED — ${validationResult.errorsCount} Fatal Formatting Errors Found`}
            </h3>
            <p className="text-xs text-slate-300">
              {validationResult.isValid
                ? `Validated ${validationResult.matchingStats?.totalEntities} entities with ${validationResult.matchingStats?.totalMatchedPairs} matched pairs. Delimiters, headers, and IDs pass all checks.`
                : 'Fix the formatting errors below before uploading to avoid competition rejection.'}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        {validationResult.matchingStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Total S1 Entities</span>
              <span className="font-mono font-bold text-white text-base">
                {validationResult.matchingStats.totalEntities}
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Singletons (Empty Matches)</span>
              <span className="font-mono font-bold text-purple-400 text-base">
                {validationResult.matchingStats.singletonEntities}
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Total Matched Pairs</span>
              <span className="font-mono font-bold text-emerald-400 text-base">
                {validationResult.matchingStats.totalMatchedPairs}
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Candidate Subset Check</span>
              <span className="font-mono font-bold text-blue-400 text-base">
                {validationResult.warningsCount === 0 ? 'Verified' : `${validationResult.warningsCount} Warnings`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Issues List (if any) */}
      {validationResult.issues.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-bold text-white tracking-wide uppercase">
            Diagnostics & Issues ({validationResult.issues.length})
          </h3>
          <div className="space-y-1.5">
            {validationResult.issues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded text-xs flex items-start gap-2 ${
                  issue.severity === 'error'
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                }`}
              >
                <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-950">
                  {issue.severity}
                </span>
                {issue.line && <span className="font-mono text-[10px]">Line {issue.line}:</span>}
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-Pane Editor: matching_results.tsv vs candidate_pairs.tsv */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* matching_results.tsv */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white font-mono">matching_results.tsv</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                Leaderboard Scored
              </span>
            </div>
            <button
              onClick={() => handleDownload('matching_results.tsv', matchingTsv)}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>

          <textarea
            rows={10}
            value={matchingTsv}
            onChange={(e) => setMatchingTsv(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
          />
          <p className="text-[10px] text-slate-500">
            Format: <code>source1_entity_id[TAB]matched_id1 matched_id2 ...</code> (space separated)
          </p>
        </div>

        {/* candidate_pairs.tsv */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white font-mono">candidate_pairs.tsv</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                Blocking Candidates
              </span>
            </div>
            <button
              onClick={() => handleDownload('candidate_pairs.tsv', candidateTsv)}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>

          <textarea
            rows={10}
            value={candidateTsv}
            onChange={(e) => setCandidateTsv(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
          />
          <p className="text-[10px] text-slate-500">
            Format: <code>source1_entity_id[TAB]cand_id1 cand_id2 ...</code> (matches must be subset)
          </p>
        </div>
      </div>
    </div>
  );
};
