"""Train/validation splitting script."""
from src.config import SEED

def split_entities(entity_ids, train_ratio=0.8):
    import random
    rng = random.Random(SEED)
    sorted_ids = sorted(list(entity_ids))
    rng.shuffle(sorted_ids)
    
    n_train = int(len(sorted_ids) * train_ratio)
    return set(sorted_ids[:n_train]), set(sorted_ids[n_train:])
