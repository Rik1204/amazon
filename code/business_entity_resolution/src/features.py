"""26 Pair feature extraction and Levenshtein / Jaro-Winkler distances."""
from src.normalize import name_tokens, address_tokens, skeleton

FREQUENT_WORDS = {
    'US': {'llc', 'inc', 'corp', 'corporation', 'co', 'company', 'ltd', 'limited', 'services', 'enterprises'},
    'India': {'pvt', 'ltd', 'private', 'limited', 'enterprises', 'trading', 'company', 'associates', 'services'},
    'France': {'sarl', 'sas', 'sasu', 'sa', 'eurl', 'sci', 'france', 'services', 'societe', 'cie'},
}

def levenshtein_ratio(s1: str, s2: str) -> float:
    if s1 == s2:
        return 1.0
    if not s1 or not s2:
        return 0.0
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            cost = 0 if s1[i - 1] == s2[j - 1] else 1
            dp[i][j] = min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    return max(0.0, (m + n - dp[m][n]) / (m + n))

def jaro_winkler(s1: str, s2: str) -> float:
    if s1 == s2:
        return 1.0
    l1, l2 = len(s1), len(s2)
    if l1 == 0 or l2 == 0:
        return 0.0
    match_distance = (max(l1, l2) // 2) - 1
    s1_matches = [False] * l1
    s2_matches = [False] * l2
    matches = 0
    for i in range(l1):
        start = max(0, i - match_distance)
        end = min(i + match_distance + 1, l2)
        for j in range(start, end):
            if s2_matches[j] or s1[i] != s2[j]:
                continue
            s1_matches[i] = True
            s2_matches[j] = True
            matches += 1
            break
    if matches == 0:
        return 0.0
    transpositions = 0
    k = 0
    for i in range(l1):
        if not s1_matches[i]:
            continue
        while not s2_matches[k]:
            k += 1
        if s1[i] != s2[k]:
            transpositions += 1
        k += 1
    jaro = (matches / l1 + matches / l2 + (matches - transpositions / 2) / matches) / 3.0
    prefix = 0
    for i in range(min(4, min(l1, l2))):
        if s1[i] == s2[i]:
            prefix += 1
        else:
            break
    return jaro + prefix * 0.1 * (1.0 - jaro)

def token_set_ratio(s1: str, s2: str) -> float:
    set1 = set(s1.split())
    set2 = set(s2.split())
    inter = sorted(list(set1 & set2))
    diff1 = sorted(list(set1 - set2))
    diff2 = sorted(list(set2 - set1))
    
    inter_str = " ".join(inter)
    s1_rest = " ".join(filter(None, [inter_str, " ".join(diff1)]))
    s2_rest = " ".join(filter(None, [inter_str, " ".join(diff2)]))
    
    if not inter_str:
        return levenshtein_ratio(s1_rest, s2_rest)
    return max(
        levenshtein_ratio(inter_str, s1_rest),
        levenshtein_ratio(inter_str, s2_rest),
        levenshtein_ratio(s1_rest, s2_rest)
    )

def token_sort_ratio(s1: str, s2: str) -> float:
    t1 = " ".join(sorted(s1.split()))
    t2 = " ".join(sorted(s2.split()))
    return levenshtein_ratio(t1, t2)

def partial_ratio(s1: str, s2: str) -> float:
    if not s1 or not s2:
        return 0.0
    if s1 == s2:
        return 1.0
    shorter, longer = (s1, s2) if len(s1) <= len(s2) else (s2, s1)
    if len(shorter) == 0:
        return 0.0
    max_r = 0.0
    slen = len(shorter)
    for i in range(len(longer) - slen + 1):
        sub = longer[i:i + slen]
        r = levenshtein_ratio(shorter, sub)
        if r > max_r:
            max_r = r
        if max_r >= 0.99:
            break
    return max_r

def extract_features(s1: dict, pool: dict, block_score: float, block_rank: int, best_block_score: float, best_name_set=1.0, best_addr_set=1.0) -> dict:
    country = s1.get('country') or pool.get('country') or 'US'
    freq_set = FREQUENT_WORDS.get(country, FREQUENT_WORDS['US'])
    
    s1_nt = name_tokens(s1['name'])
    p_nt = name_tokens(pool['name'])
    s1_name_clean = " ".join(s1_nt)
    p_name_clean = " ".join(p_nt)
    s1_nospace = "".join(s1_nt)
    p_nospace = "".join(p_nt)
    
    s1_skel = " ".join(skeleton(t) or t for t in s1_nt)
    p_skel = " ".join(skeleton(t) or t for t in p_nt)
    
    s1_core = " ".join([t for t in s1_nt if t not in freq_set] or s1_nt)
    p_core = " ".join([t for t in p_nt if t not in freq_set] or p_nt)
    
    s1_at = address_tokens(s1.get('address', ''))
    p_at = address_tokens(pool.get('address', ''))
    s1_addr_clean = " ".join(s1_at)
    p_addr_clean = " ".join(p_at)
    
    s1_nums = [t for t in s1_at if t.isdigit()][:4]
    p_nums = [t for t in p_at if t.isdigit()][:4]
    shared_nums = [n for n in p_nums if n in set(s1_nums)]
    
    s1_prim = s1_nums[0] if s1_nums else ""
    p_prim = p_nums[0] if p_nums else ""
    primary_conflict = 1 if (s1_prim and p_prim and s1_prim != p_prim) else 0
    primary_match = 1 if (s1_prim and p_prim and s1_prim == p_prim) else 0
    
    name_set = token_set_ratio(s1_name_clean, p_name_clean)
    addr_set = token_set_ratio(s1_addr_clean, p_addr_clean) if s1_addr_clean and p_addr_clean else 0.0
    
    return {
        'block_score': round(block_score, 4),
        'block_rank': block_rank,
        'block_score_rel': round(block_score / best_block_score if best_block_score > 0 else 1.0, 4),
        'name_ratio': round(levenshtein_ratio(s1_name_clean, p_name_clean), 4),
        'name_token_set': round(name_set, 4),
        'name_token_sort': round(token_sort_ratio(s1_name_clean, p_name_clean), 4),
        'name_partial': round(partial_ratio(s1_name_clean, p_name_clean), 4),
        'name_jw': round(jaro_winkler(s1_name_clean, p_name_clean), 4),
        'name_nospace_ratio': round(levenshtein_ratio(s1_nospace, p_nospace), 4),
        'skel_ratio': round(levenshtein_ratio(s1_skel, p_skel), 4),
        'skel_token_set': round(token_set_ratio(s1_skel, p_skel), 4),
        'core_ratio': round(levenshtein_ratio(s1_core, p_core), 4),
        'core_token_set': round(token_set_ratio(s1_core, p_core), 4),
        'addr_ratio': round(levenshtein_ratio(s1_addr_clean, p_addr_clean) if s1_addr_clean and p_addr_clean else 0.0, 4),
        'addr_token_set': round(addr_set, 4),
        'addr_partial': round(partial_ratio(s1_addr_clean, p_addr_clean) if s1_addr_clean and p_addr_clean else 0.0, 4),
        'num_shared': len(shared_nums),
        'num_s1': len(s1_nums),
        'num_pool': len(p_nums),
        'primary_conflict': primary_conflict,
        'primary_match': primary_match,
        'num_pool_share': round(len(shared_nums) / len(p_nums) if len(p_nums) > 0 else 0.0, 4),
        'name_words_s1': len(s1_nt),
        'name_words_pool': len(p_nt),
        'pool_addr_empty': 1 if len(p_at) == 0 else 0,
        'is_s3': 1 if pool.get('id', '').startswith('S3-') else 0,
        'name_token_set_vs_best': round(name_set - best_name_set, 4),
        'addr_token_set_vs_best': round(addr_set - best_addr_set, 4),
    }
