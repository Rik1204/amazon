"""Output TSV writer conforming to official Amazon ML challenge specification."""
import os
from pathlib import Path

def write_submission_files(output_dir, matches_dict, candidates_dict=None):
    """
    matches_dict: dict of s1_id -> list of matched IDs
    candidates_dict: dict of s1_id -> list of candidate IDs
    """
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    # Write matching_results.tsv
    matching_file = out_path / "matching_results.tsv"
    with open(matching_file, "w", encoding="utf-8") as f:
        f.write("source1_entity_id\tmatched_entity_ids\n")
        for s1_id, m_list in sorted(matches_dict.items()):
            # Important: Comma separated as per official competition readme
            line = f"{s1_id}\t{','.join(m_list)}\n"
            f.write(line)
            
    # Write candidate_pairs.tsv if provided
    if candidates_dict is not None:
        candidate_file = out_path / "candidate_pairs.tsv"
        with open(candidate_file, "w", encoding="utf-8") as f:
            f.write("source1_entity_id\tcandidate_entity_ids\n")
            for s1_id, c_list in sorted(candidates_dict.items()):
                line = f"{s1_id}\t{','.join(c_list)}\n"
                f.write(line)
