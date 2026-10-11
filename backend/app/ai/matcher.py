"""
Smart Caretaker Assignment Matcher (§2.2, §6, §8)
Matches complaints to the most qualified, available caretaker in the same hostel
based on trade skills (electrical, plumbing, civil, housekeeping), proficiency, and active workload.
"""

from typing import List, Dict, Any, Optional

CATEGORY_TO_SKILL = {
    "ELECTRICAL": "electrical",
    "WATER": "plumbing",
    "CIVIL": "civil",
    "HYGIENE": "housekeeping",
    "SECURITY": "civil",   # or general
    "MISC": "general"
}


class CaretakerMatcher:
    """
    Autonomous caretaker assignment matcher.
    """

    @classmethod
    def match_caretaker(
        cls,
        complaint: Dict[str, Any],
        caretakers: List[Dict[str, Any]],
        active_workloads: Optional[Dict[str, int]] = None
    ) -> Dict[str, Any]:
        """
        Finds optimal caretaker for a complaint.
        
        Args:
            complaint: dict with category_code, hostel_id/hostel_code
            caretakers: list of caretaker dicts with:
                - id: str/UUID
                - full_name: str
                - hostel_code: str
                - skills: dict or list of {skill: str, proficiency: int}
            active_workloads: dict mapping caretaker_id -> count of active tickets
        """
        if not caretakers:
            return {
                "matched": False,
                "caretaker_id": None,
                "caretaker_name": None,
                "skill": None,
                "score": 0.0,
                "reason": "No caretakers registered in system"
            }

        active_workloads = active_workloads or {}
        category = complaint.get("category_code", "MISC")
        target_skill = CATEGORY_TO_SKILL.get(category, "general")
        target_hostel = complaint.get("hostel_code") or complaint.get("hostel_id")

        candidates = []
        for c in caretakers:
            # Check hostel match if specified
            c_hostel = c.get("hostel_code") or c.get("hostel_id")
            if target_hostel and c_hostel and str(target_hostel).lower() != str(c_hostel).lower():
                continue

            # Parse skills & proficiencies
            c_skills = c.get("skills", {})
            if isinstance(c_skills, list):
                # list of dicts: [{"skill": "electrical", "proficiency": 4}]
                skill_dict = {s.get("skill", "").lower(): s.get("proficiency", 3) for s in c_skills}
            elif isinstance(c_skills, dict):
                skill_dict = {k.lower(): v for k, v in c_skills.items()}
            else:
                skill_dict = {}

            # Evaluate skill match
            has_exact = target_skill.lower() in skill_dict
            proficiency = skill_dict.get(target_skill.lower(), 1 if has_exact else 0)
            
            # If target is general/misc, give base proficiency
            if target_skill == "general":
                proficiency = max(skill_dict.values()) if skill_dict else 3

            c_id = str(c.get("id"))
            workload = active_workloads.get(c_id, 0)

            # Match Score Formula:
            # +50 points for skill presence
            # +10 * proficiency (max 50)
            # -5 per active ticket (load balancing penalty)
            skill_score = 50.0 if (has_exact or target_skill == "general") else 10.0
            prof_score = float(proficiency) * 10.0
            workload_penalty = float(workload) * 5.0

            total_score = max(0.0, skill_score + prof_score - workload_penalty)

            candidates.append({
                "caretaker": c,
                "caretaker_id": c_id,
                "caretaker_name": c.get("full_name", "Unknown Caretaker"),
                "has_skill": has_exact,
                "proficiency": proficiency,
                "workload": workload,
                "score": round(total_score, 2)
            })

        if not candidates:
            return {
                "matched": False,
                "caretaker_id": None,
                "caretaker_name": None,
                "skill": target_skill,
                "score": 0.0,
                "reason": f"No available caretakers located in hostel {target_hostel}"
            }

        # Sort: highest score first, then lowest workload
        candidates.sort(key=lambda x: (-x["score"], x["workload"]))
        best = candidates[0]

        reason = (
            f"Matched {best['caretaker_name']} for {category} ({target_skill}) "
            f"with proficiency {best['proficiency']}/5 and current active load of {best['workload']} tickets"
        )

        return {
            "matched": True,
            "caretaker_id": best["caretaker_id"],
            "caretaker_name": best["caretaker_name"],
            "skill": target_skill,
            "proficiency": best["proficiency"],
            "workload": best["workload"],
            "score": best["score"],
            "reason": reason
        }
