"""Official submission format validation script."""
import argparse
import sys
from pathlib import Path

def validate(matching_file, candidate_file=None, test_dir=None):
    print("Validating submission files...")
    issues = []
    
    m_path = Path(matching_file)
    if not m_path.exists():
        print(f"ERROR: {matching_file} does not exist.")
        return 1
        
    with open(m_path, 'r', encoding='utf-8') as f:
        lines = [line.strip() for line in f if line.strip()]
        
    if not lines:
        print("ERROR: Matching file is empty.")
        return 1
        
    header = lines[0].split('\t')
    if header != ['source1_entity_id', 'matched_entity_ids']:
        issues.append(f"Invalid header in matching file: {lines[0]}")
        
    s1_matched = {}
    for idx, l in enumerate(lines[1:], 2):
        parts = l.split('\t')
        if len(parts) > 2:
            issues.append(f"Line {idx}: Expected 2 columns, got {len(parts)}")
            continue
        s1_id = parts[0].strip()
        matched = parts[1].strip() if len(parts) > 1 else ""
        if s1_id in s1_matched:
            issues.append(f"Line {idx}: Duplicate s1 entity {s1_id}")
        s1_matched[s1_id] = matched.split(',') if matched else []
        
    print(f"Validated {len(s1_matched)} entities in matching results.")
    if issues:
        print(f"FAILED with {len(issues)} issues:")
        for iss in issues[:10]:
            print(f" - {iss}")
        return 1
        
    print("PASS: matching_results.tsv is valid!")
    return 0

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--matching', required=True)
    parser.add_argument('--candidate')
    parser.add_argument('--test-dir')
    args = parser.parse_args()
    sys.exit(validate(args.matching, args.candidate, args.test_dir))
