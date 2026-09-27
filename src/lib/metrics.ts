// The competition metric: exact macro-averaged F0.5 over Source 1 entities matching src/metrics.py

const BETA2 = 0.25; // beta = 0.5 -> beta^2 = 0.25 -> precision counts twice as much as recall

export interface EntityScore {
  s1Id: string;
  isSingleton: boolean;
  predicted: string[];
  trueMatches: string[];
  truePositives: number;
  precision: number;
  recall: number;
  f05: number;
}

export interface ScoreReport {
  nEntities: number;
  macroF05: number;
  meanPrecision: number;
  meanRecall: number;
  singletonsCount: number;
  matchedCount: number;
  f05Singletons?: number;
  f05Matched?: number;
  entityScores: EntityScore[];
}

/**
 * f05_entity: calculate F0.5 score for one entity
 *
 * For one S1 entity with true match set T and predicted set P:
 * - T empty (singleton):  score 1.0 if P is empty, else 0.0
 * - T non-empty:          precision = |P & T| / |P|, recall = |P & T| / |T|
 *                         F0.5 = 1.25 * p * r / (0.25 * p + r) (0.0 if no hit)
 */
export function f05Entity(
  predicted: string[] | Set<string>,
  trueMatches: string[] | Set<string>
): { f05: number; precision: number; recall: number; tp: number } {
  const pSet = new Set(predicted);
  const tSet = new Set(trueMatches);

  // Singleton case: ground truth is empty
  if (tSet.size === 0) {
    const f05 = pSet.size === 0 ? 1.0 : 0.0;
    return { f05, precision: pSet.size === 0 ? 1.0 : 0.0, recall: 1.0, tp: 0 };
  }

  // Non-singleton
  let tp = 0;
  pSet.forEach((id) => {
    if (tSet.has(id)) tp++;
  });

  if (tp === 0 || pSet.size === 0) {
    return { f05: 0.0, precision: 0.0, recall: 0.0, tp: 0 };
  }

  const precision = tp / pSet.size;
  const recall = tp / tSet.size;
  const f05 = ((1 + BETA2) * precision * recall) / (BETA2 * precision + recall);

  return { f05, precision, recall, tp };
}

/**
 * Compute full score report across multiple entities matching score_report in metrics.py
 */
export function computeScoreReport(
  predictions: Record<string, string[]>,
  truth: Record<string, string[]>
): ScoreReport {
  const entityIds = Object.keys(truth);
  if (entityIds.length === 0) {
    return {
      nEntities: 0,
      macroF05: 0,
      meanPrecision: 0,
      meanRecall: 0,
      singletonsCount: 0,
      matchedCount: 0,
      entityScores: [],
    };
  }

  const entityScores: EntityScore[] = [];
  let sumF05 = 0;
  let sumPrec = 0;
  let sumRec = 0;

  const singlesScores: number[] = [];
  const matchedScores: number[] = [];

  for (const s1Id of entityIds) {
    const t = truth[s1Id] || [];
    const p = predictions[s1Id] || [];
    const { f05, precision, recall, tp } = f05Entity(p, t);
    const isSingleton = t.length === 0;

    sumF05 += f05;
    sumPrec += precision;
    sumRec += recall;

    if (isSingleton) {
      singlesScores.push(f05);
    } else {
      matchedScores.push(f05);
    }

    entityScores.push({
      s1Id,
      isSingleton,
      predicted: p,
      trueMatches: t,
      truePositives: tp,
      precision,
      recall,
      f05,
    });
  }

  const n = entityIds.length;
  const macroF05 = sumF05 / n;
  const meanPrecision = sumPrec / n;
  const meanRecall = sumRec / n;

  const f05Singletons =
    singlesScores.length > 0
      ? singlesScores.reduce((a, b) => a + b, 0) / singlesScores.length
      : undefined;

  const f05Matched =
    matchedScores.length > 0
      ? matchedScores.reduce((a, b) => a + b, 0) / matchedScores.length
      : undefined;

  return {
    nEntities: n,
    macroF05: Number(macroF05.toFixed(4)),
    meanPrecision: Number(meanPrecision.toFixed(4)),
    meanRecall: Number(meanRecall.toFixed(4)),
    singletonsCount: singlesScores.length,
    matchedCount: matchedScores.length,
    f05Singletons: f05Singletons !== undefined ? Number(f05Singletons.toFixed(4)) : undefined,
    f05Matched: f05Matched !== undefined ? Number(f05Matched.toFixed(4)) : undefined,
    entityScores,
  };
}
