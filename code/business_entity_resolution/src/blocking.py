"""Stage 1: Rare-key TF-IDF blocking across S2 and S3 pools."""
from collections import defaultdict
import math
from src.normalize import name_tokens, address_tokens, skeleton

MAX_NAME_TOKENS = 6
MAX_DF_CUTOFF = 5000

def generate_record_keys(name: str, address: str) -> list:
    n_tokens = name_tokens(name)
    skeletons = sorted(list({skeleton(t) for t in n_tokens[:MAX_NAME_TOKENS] if len(skeleton(t)) >= 2}))
    keys = []
    
    # n:<word>
    for t in n_tokens:
        keys.append(f"n:{t}")
        
    # k:<skeleton>
    for s in skeletons:
        keys.append(f"k:{s}")
        
    # p:<s1>_<s2> (unordered pairs of skeletons)
    for i in range(len(skeletons)):
        for j in range(i + 1, len(skeletons)):
            keys.append(f"p:{skeletons[i]}_{skeletons[j]}")
            
    # c:<w1w2..> (glued words)
    for i in range(1, min(4, len(n_tokens) + 1)):
        keys.append(f"c:{''.join(n_tokens[:i])}")
        
    # Address keys
    a_tokens = address_tokens(address or "")
    for t in a_tokens:
        keys.append(f"a:{t}")
        
    # Bigrams
    for i in range(len(a_tokens) - 1):
        keys.append(f"b:{a_tokens[i]}_{a_tokens[i+1]}")
        
    return keys

class RareKeyIndex:
    def __init__(self, records):
        """
        records: list of dicts with 'id', 'name', 'address', 'country'
        """
        self.records = records
        self.n_records = len(records)
        self.doc_freqs = defaultdict(int)
        self.rec_keys = []
        
        for r in records:
            keys = set(generate_record_keys(r['name'], r.get('address', '')))
            self.rec_keys.append(keys)
            for k in keys:
                self.doc_freqs[k] += 1
                
        # Compute IDF
        self.idf = {}
        for k, df in self.doc_freqs.items():
            if df > MAX_DF_CUTOFF and df > self.n_records * 0.4:
                continue
            self.idf[k] = math.log((self.n_records + 1) / (df + 1)) + 1.0
            
        # Inverted index: key -> list of (record_idx, tf_idf_weight)
        self.inverted_index = defaultdict(list)
        self.norms = [0.0] * self.n_records
        
        for idx, keys in enumerate(self.rec_keys):
            norm_sq = 0.0
            for k in keys:
                weight = self.idf.get(k, 0.0)
                if weight > 0:
                    self.inverted_index[k].append((idx, weight))
                    norm_sq += weight * weight
            self.norms[idx] = math.sqrt(norm_sq) if norm_sq > 0 else 1.0

    def query(self, s1_record, top_k=50):
        s1_keys = set(generate_record_keys(s1_record['name'], s1_record.get('address', '')))
        s1_weights = {}
        s1_norm_sq = 0.0
        
        for k in s1_keys:
            w = self.idf.get(k, 0.0)
            if w > 0:
                s1_weights[k] = w
                s1_norm_sq += w * w
                
        s1_norm = math.sqrt(s1_norm_sq) if s1_norm_sq > 0 else 1.0
        scores = defaultdict(float)
        
        for k, w1 in s1_weights.items():
            for pool_idx, w2 in self.inverted_index.get(k, []):
                scores[pool_idx] += w1 * w2
                
        ranked = []
        for pool_idx, dot_prod in scores.items():
            pool_rec = self.records[pool_idx]
            # Country filter
            if s1_record.get('country') and pool_rec.get('country') and s1_record['country'] != pool_rec['country']:
                continue
            cos = dot_prod / (s1_norm * self.norms[pool_idx])
            ranked.append((pool_rec, cos))
            
        ranked.sort(key=lambda x: x[1], reverse=True)
        return ranked[:top_k]
