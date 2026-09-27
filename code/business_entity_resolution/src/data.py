"""Dataset reading helpers with zero external dependencies."""
import csv
from pathlib import Path

def load_source_file(filepath):
    """Loads source tsv file preserving string values without NaN."""
    filepath = Path(filepath)
    records = []
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            records.append({k.strip(): (v.strip() if v else "") for k, v in row.items()})
    return records

def load_ground_truth(filepath):
    """Loads ground truth file mapping s1_id -> list of matched IDs."""
    filepath = Path(filepath)
    truth = {}
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            s1_id = row.get("source1_entity_id", "").strip()
            matched = row.get("matched_entity_ids", "").strip()
            truth[s1_id] = [m.strip() for m in matched.split(",") if m.strip()] if matched else []
    return truth
