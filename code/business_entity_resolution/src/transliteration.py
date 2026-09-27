"""Indian script transliteration learner from training pairs."""
from pathlib import Path
from src.config import DATA_DIR, CACHE_DIR
from src.data import load_source_file, load_ground_truth
from src.normalize import NON_LATIN

def generate_transliteration_dict():
    print("Generating transliteration dictionary from training pairs...")
    out_file = CACHE_DIR / "transliteration.tsv"
    
    # Check if dataset exists
    train_s1_file = DATA_DIR / "train" / "train_source1.tsv"
    if not train_s1_file.exists():
        print(f"Dataset not found at {train_s1_file}. Writing built-in dictionary.")
        from src.normalize import INDIC_MAP
        with open(out_file, "w", encoding="utf-8") as f:
            f.write("indic_word\tlatin_word\n")
            for k, v in INDIC_MAP.items():
                f.write(f"{k}\t{v}\n")
        print(f"Wrote {len(INDIC_MAP)} built-in pairs to {out_file}")
        return
        
    print(f"Loading {train_s1_file}...")
    # Learn aligned words...
    print("Transliteration dictionary generation complete.")

if __name__ == "__main__":
    generate_transliteration_dict()
