"""Metrics calculation: exact macro-averaged F0.5 per Source 1 entity."""

BETA2 = 0.25  # beta = 0.5 -> beta^2 = 0.25 (precision has 2x weight of recall)

def f05_entity(pred_set, true_set):
    """
    F0.5 for a single S1 entity.
    - True empty (singleton): 1.0 if pred is empty, else 0.0
    - True non-empty: standard F0.5; 0.0 if no hits
    """
    if len(true_set) == 0:
        return 1.0 if len(pred_set) == 0 else 0.0
    
    tp = len(pred_set & true_set)
    if tp == 0 or len(pred_set) == 0:
        return 0.0
    
    p = tp / len(pred_set)
    r = tp / len(true_set)
    return (1.0 + BETA2) * p * r / (BETA2 * p + r)

def macro_f05(predictions, ground_truth):
    """
    predictions: dict of s1_id -> set/list of predicted IDs
    ground_truth: dict of s1_id -> set/list of true matching IDs
    """
    scores = []
    singles = []
    matched = []
    
    for s1_id, t_ids in ground_truth.items():
        t_set = set(t_ids)
        p_set = set(predictions.get(s1_id, []))
        score = f05_entity(p_set, t_set)
        scores.append(score)
        if len(t_set) == 0:
            singles.append(score)
        else:
            matched.append(score)
            
    return {
        "n_entities": len(scores),
        "macro_f05": float(sum(scores) / len(scores)) if scores else 0.0,
        "f05_singletons": float(sum(singles) / len(singles)) if singles else 0.0,
        "f05_matched": float(sum(matched) / len(matched)) if matched else 0.0,
    }

