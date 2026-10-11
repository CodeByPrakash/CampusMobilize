"""
Duplicate Complaint Detection Engine (§8.2)
100% Offline duplicate detection using TF-IDF n-gram cosine similarity + location token overlap.
Rule: similarity >= 0.85 AND (same block OR same location_text) -> duplicate flag.
"""

import re
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class DuplicateDetector:
    """
    Offline duplicate detector matching incoming complaints against active tickets.
    """

    def __init__(self, similarity_threshold: float = 0.85):
        self.threshold = similarity_threshold

    @staticmethod
    def _normalize_text(text: Optional[str]) -> str:
        if not text:
            return ""
        # Lowercase and clean punctuation
        cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
        return " ".join(cleaned.split())

    @staticmethod
    def _locations_match(new_block: Optional[str], new_loc: Optional[str],
                         cand_block: Optional[str], cand_loc: Optional[str]) -> bool:
        """Checks if two complaints share the same block or specific location tokens."""
        n_block = (new_block or "").strip().lower()
        c_block = (cand_block or "").strip().lower()

        if n_block and c_block and n_block == c_block:
            return True

        n_loc = (new_loc or "").strip().lower()
        c_loc = (cand_loc or "").strip().lower()

        if n_loc and c_loc:
            if n_loc == c_loc:
                return True
            # Check overlap of substantial location tokens (e.g., 'pump room', '2nd floor')
            n_tokens = set(re.findall(r"\b[a-z0-9]{3,}\b", n_loc))
            c_tokens = set(re.findall(r"\b[a-z0-9]{3,}\b", c_loc))
            if n_tokens and c_tokens:
                overlap = n_tokens.intersection(c_tokens)
                if len(overlap) >= 2 or (len(overlap) == 1 and ("pump" in overlap or "mess" in overlap or "washroom" in overlap)):
                    return True

        return False

    def find_duplicate(
        self,
        new_complaint: Dict[str, Any],
        active_complaints: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Scans active_complaints in the same hostel.
        Returns match metadata if duplicate found.
        """
        if not active_complaints:
            return {
                "is_duplicate": False,
                "duplicate_of": None,
                "ticket_no": None,
                "similarity": 0.0,
                "reason": "No active complaints to compare"
            }

        new_text = self._normalize_text(
            f"{new_complaint.get('title', '')} {new_complaint.get('description', '')}"
        )
        new_block = new_complaint.get("block_name") or new_complaint.get("block_id")
        new_loc = new_complaint.get("location_text")

        best_sim = 0.0
        best_match: Optional[Dict[str, Any]] = None

        for candidate in active_complaints:
            cand_block = candidate.get("block_name") or candidate.get("block_id")
            cand_loc = candidate.get("location_text")

            # First check location overlap
            if not self._locations_match(new_block, new_loc, cand_block, cand_loc):
                continue

            cand_text = self._normalize_text(
                f"{candidate.get('title', '')} {candidate.get('description', '')}"
            )

            # Compute TF-IDF character + word n-gram similarity
            try:
                vec = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5))
                matrix = vec.fit_transform([new_text, cand_text])
                sim = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
            except Exception:
                sim = 0.0

            if sim > best_sim:
                best_sim = sim
                best_match = candidate

        if best_match and best_sim >= self.threshold:
            ticket = best_match.get("ticket_no") or str(best_match.get("id"))
            return {
                "is_duplicate": True,
                "duplicate_of": best_match.get("id") or best_match.get("ticket_no"),
                "ticket_no": ticket,
                "similarity": round(best_sim, 3),
                "reason": f"High similarity ({round(best_sim, 2)}) with {ticket} at same location ({new_block or new_loc})"
            }

        return {
            "is_duplicate": False,
            "duplicate_of": None,
            "ticket_no": None,
            "similarity": round(best_sim, 3),
            "reason": "No duplicates exceeding similarity threshold"
        }
