"""Sanity check and scorer unit tests."""
from src.metrics import f05_entity, macro_f05

def run_tests():
    print("Running scorer tests...")
    
    # 1. PDF Example Test:
    # Pred: S2-00047, S2-00193, S3-00812 (3 items)
    # True: S2-00047, S3-00812 (2 items)
    # Precision = 2/3 = 0.6667, Recall = 2/2 = 1.0 -> F0.5 = 0.714
    score_pdf = f05_entity({"S2-00047", "S2-00193", "S3-00812"}, {"S2-00047", "S3-00812"})
    assert abs(score_pdf - 0.714) < 0.001, f"Expected ~0.714, got {score_pdf}"
    print(f"PDF example check passed: F0.5 = {score_pdf:.3f}")
    
    # 2. Perfect match
    score_perf = f05_entity({"A", "B"}, {"A", "B"})
    assert score_perf == 1.0
    print("Perfect match check passed: 1.0")
    
    # 3. Singleton correctly predicted empty
    score_sing_correct = f05_entity(set(), set())
    assert score_sing_correct == 1.0
    print("Singleton empty match check passed: 1.0")
    
    # 4. Singleton predicted with false positive
    score_sing_wrong = f05_entity({"A"}, set())
    assert score_sing_wrong == 0.0
    print("Singleton false positive penalty check passed: 0.0")
    
    # 5. Macro F0.5
    macro = macro_f05(
        {"S1-1": ["S2-1"], "S1-2": []},
        {"S1-1": ["S2-1"], "S1-2": []}
    )
    assert macro['macro_f05'] == 1.0
    print(f"Macro F0.5 check passed: {macro['macro_f05']}")
    print("All scorer checks PASSED successfully!")

if __name__ == "__main__":
    run_tests()
