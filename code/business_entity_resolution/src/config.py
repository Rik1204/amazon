"""Paths and configuration settings."""
import os
from pathlib import Path

SEED = 42

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent.parent

DATA_DIR = Path(os.environ.get("BER_DATA_DIR", PROJECT_ROOT / "student_resource" / "dataset"))
OUTPUT_DIR = Path(os.environ.get("BER_OUTPUT_DIR", PROJECT_ROOT / "output"))
CACHE_DIR = BASE_DIR / "cache"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)
