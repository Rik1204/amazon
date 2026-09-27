// Submission Validator matching student_resource/utils/validate_submission.py

export interface ValidationIssue {
  severity: 'error' | 'warning';
  line?: number;
  entityId?: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errorsCount: number;
  warningsCount: number;
  issues: ValidationIssue[];
  matchingStats?: {
    totalEntities: number;
    singletonEntities: number;
    matchedEntities: number;
    totalMatchedPairs: number;
    maxMatchesPerEntity: number;
    avgMatchesPerEntity: number;
  };
  candidateStats?: {
    totalEntities: number;
    totalCandidatePairs: number;
    maxCandidatesPerEntity: number;
    avgCandidatesPerEntity: number;
  };
}

/**
 * Validates matching_results.tsv and optional candidate_pairs.tsv text content
 */
export function validateSubmission(
  matchingTsvContent: string,
  candidateTsvContent?: string
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!matchingTsvContent || !matchingTsvContent.trim()) {
    return {
      isValid: false,
      errorsCount: 1,
      warningsCount: 0,
      issues: [{ severity: 'error', message: 'matching_results.tsv content is empty.' }],
    };
  }

  // 1. Validate matching_results.tsv
  const matchingLines = matchingTsvContent.trim().split(/\r?\n/);
  const matchingHeader = matchingLines[0].split('\t');

  if (matchingHeader[0] !== 'source1_entity_id' || matchingHeader[1] !== 'matched_entity_ids') {
    issues.push({
      severity: 'error',
      line: 1,
      message: `Invalid matching_results.tsv header. Expected 'source1_entity_id\\tmatched_entity_ids', found '${matchingLines[0]}'`,
    });
  }

  const matchingMap = new Map<string, string[]>();
  let totalMatchedPairs = 0;
  let maxMatches = 0;
  let singletons = 0;

  for (let i = 1; i < matchingLines.length; i++) {
    const rawLine = matchingLines[i];
    if (!rawLine.trim()) continue;

    const parts = rawLine.split('\t');
    if (parts.length > 2) {
      issues.push({
        severity: 'error',
        line: i + 1,
        message: `Line has ${parts.length} columns (expected exactly 2 columns separated by a single tab).`,
      });
      continue;
    }

    const s1Id = parts[0].trim();
    if (!s1Id) {
      issues.push({
        severity: 'error',
        line: i + 1,
        message: 'Empty source1_entity_id found.',
      });
      continue;
    }

    if (matchingMap.has(s1Id)) {
      issues.push({
        severity: 'error',
        line: i + 1,
        entityId: s1Id,
        message: `Duplicate entity ID '${s1Id}' in matching_results.tsv.`,
      });
    }

    const matchesStr = (parts[1] || '').trim();
    const matches = matchesStr ? matchesStr.split(/\s+/).filter(Boolean) : [];

    // Check for comma error (common student mistake)
    if (matchesStr.includes(',')) {
      issues.push({
        severity: 'error',
        line: i + 1,
        entityId: s1Id,
        message: `Comma found in matched_entity_ids ('${matchesStr}'). IDs must be space-separated!`,
      });
    }

    // Check for duplicate matches for same S1
    const uniqueMatches = new Set(matches);
    if (uniqueMatches.size !== matches.length) {
      issues.push({
        severity: 'warning',
        line: i + 1,
        entityId: s1Id,
        message: `Duplicate candidate IDs found in matches for entity '${s1Id}'.`,
      });
    }

    matchingMap.set(s1Id, matches);

    if (matches.length === 0) {
      singletons++;
    } else {
      totalMatchedPairs += matches.length;
      if (matches.length > maxMatches) {
        maxMatches = matches.length;
      }
    }
  }

  // 2. Validate candidate_pairs.tsv if provided
  let candidateStats: ValidationResult['candidateStats'] | undefined;
  const candidateMap = new Map<string, Set<string>>();

  if (candidateTsvContent && candidateTsvContent.trim()) {
    const candidateLines = candidateTsvContent.trim().split(/\r?\n/);
    const candidateHeader = candidateLines[0].split('\t');

    if (candidateHeader[0] !== 'source1_entity_id' || candidateHeader[1] !== 'candidate_entity_ids') {
      issues.push({
        severity: 'warning',
        line: 1,
        message: `Candidate header should be 'source1_entity_id\\tcandidate_entity_ids', found '${candidateLines[0]}'`,
      });
    }

    let totalCandidatePairs = 0;
    let maxCandidates = 0;

    for (let i = 1; i < candidateLines.length; i++) {
      const rawLine = candidateLines[i];
      if (!rawLine.trim()) continue;

      const parts = rawLine.split('\t');
      const s1Id = parts[0].trim();
      const candsStr = (parts[1] || '').trim();
      const cands = candsStr ? candsStr.split(/\s+/).filter(Boolean) : [];

      candidateMap.set(s1Id, new Set(cands));
      totalCandidatePairs += cands.length;
      if (cands.length > maxCandidates) {
        maxCandidates = cands.length;
      }
    }

    const totalCandsEntities = candidateMap.size;
    candidateStats = {
      totalEntities: totalCandsEntities,
      totalCandidatePairs,
      maxCandidatesPerEntity: maxCandidates,
      avgCandidatesPerEntity: totalCandsEntities > 0 ? Number((totalCandidatePairs / totalCandsEntities).toFixed(2)) : 0,
    };

    // Subset rule check: every matched ID in matching_results must be present in candidate_pairs
    matchingMap.forEach((matches, s1Id) => {
      const candidates = candidateMap.get(s1Id);
      if (!candidates) {
        issues.push({
          severity: 'warning',
          entityId: s1Id,
          message: `Entity '${s1Id}' has matches but is missing from candidate_pairs.tsv.`,
        });
        return;
      }

      for (const mId of matches) {
        if (!candidates.has(mId)) {
          issues.push({
            severity: 'warning',
            entityId: s1Id,
            message: `Matched ID '${mId}' was not found in candidate set for '${s1Id}'. Final matches should be a subset of candidates.`,
          });
        }
      }
    });
  }

  const errorsCount = issues.filter((i) => i.severity === 'error').length;
  const warningsCount = issues.filter((i) => i.severity === 'warning').length;
  const totalEntities = matchingMap.size;

  return {
    isValid: errorsCount === 0,
    errorsCount,
    warningsCount,
    issues,
    matchingStats: {
      totalEntities,
      singletonEntities: singletons,
      matchedEntities: totalEntities - singletons,
      totalMatchedPairs,
      maxMatchesPerEntity: maxMatches,
      avgMatchesPerEntity: totalEntities > 0 ? Number((totalMatchedPairs / totalEntities).toFixed(2)) : 0,
    },
    candidateStats,
  };
}
