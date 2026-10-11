"""
CampusIQ AI Engine Package (§8)
Provides offline, deterministic and ML-powered facility intelligence:
- Complaint Classification (§8.1)
- Duplicate Detection (§8.2)
- Risk Scoring & Priority Banding (§8.3)
- Dynamic Queue Ranking (§8.4)
- Caretaker Smart Matcher (§2.2, §6)
- Festival Demand Forecaster & Pre-Brief Generator (§8.5)
- Bill Parser (§8.5)
- Campus Risk Index (§8.6)
"""

from .engine import CampusAIEngine
from .classifier import ComplaintClassifier
from .dedup import DuplicateDetector
from .risk import RiskScorer
from .ranking import RankingScorer
from .matcher import CaretakerMatcher
from .forecaster import UtilityForecaster
from .prebrief import PreBriefGenerator
from .bill_parser import BillParser
from .campus_index import CampusRiskIndexCalculator
from .continuous_learning import ContinuousLearningEngine

__all__ = [
    "CampusAIEngine",
    "ComplaintClassifier",
    "DuplicateDetector",
    "RiskScorer",
    "RankingScorer",
    "CaretakerMatcher",
    "UtilityForecaster",
    "PreBriefGenerator",
    "BillParser",
    "CampusRiskIndexCalculator",
    "ContinuousLearningEngine"
]
