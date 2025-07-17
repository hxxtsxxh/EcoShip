from typing import Dict, List, Any, Tuple
import logging
from dataclasses import dataclass


logger = logging.getLogger(__name__)


@dataclass
class EcoEfficiencyScore:
    """
    SRP: Single responsibility for eco-efficiency score data structure.
    Contains all scoring information for a single shipping quote.
    """
    points: float
    cost_effectiveness_score: float
    environmental_score: float
    cost_per_kg: float
    carbon_per_kg: float
    tier: str
    explanation: str


@dataclass
class ScoringWeights:
    """
    SRP: Single responsibility for scoring weight configuration.
    Defines the balance between cost and environmental factors.
    """
    cost_effectiveness: float = 0.70  # 70% weight
    environmental_impact: float = 0.30  # 30% weight
    
    def validate(self) -> bool:
        """Ensure weights sum to 1.0"""
        return abs(self.cost_effectiveness + self.environmental_impact - 1.0) < 0.001


class EcoEfficiencyScorer:
    """
    SRP: Single responsibility for calculating eco-efficiency scores.
    Balances cost-effectiveness with environmental impact using weighted scoring.
    """
    
    # Scoring tiers and point ranges (0-25 scale)
    TIER_RANGES = {
        "excellent": (21, 25),      # Most economical with reasonable environmental performance
        "very_good": (17, 20),      # Good balance of cost and environment
        "good": (13, 16),           # Moderate eco-friendly options with cost trade-offs
        "fair": (9, 12),            # Medium-speed services with minimal differences
        "poor": (5, 8),             # Expensive express services
        "very_poor": (0, 4)         # Most expensive with poor environmental performance
    }
    
    def __init__(self, weights: ScoringWeights = None):
        """
        Initialize the eco-efficiency scorer.
        
        Args:
            weights: Custom scoring weights (defaults to 70% cost, 30% environment)
        """
        self.weights = weights or ScoringWeights()
        if not self.weights.validate():
            raise ValueError("Scoring weights must sum to 1.0")
        
        logger.info(f"EcoEfficiencyScorer initialized with weights: "
                   f"cost={self.weights.cost_effectiveness:.0%}, "
                   f"environment={self.weights.environmental_impact:.0%}")
    
    def calculate_scores(
        self, 
        quotes: List[Dict[str, Any]], 
        weight_kg: float
    ) -> List[EcoEfficiencyScore]:
        """
        Calculate eco-efficiency scores for all quotes in a shipment.
        
        Args:
            quotes: List of shipping quotes with cost and carbon data
            weight_kg: Package weight for per-kg calculations
            
        Returns:
            List of EcoEfficiencyScore objects with normalized scoring
        """
        if not quotes:
            raise ValueError("No quotes provided for scoring")
        
        if weight_kg <= 0:
            raise ValueError("Package weight must be positive")
        
        logger.info(f"Calculating eco-efficiency scores for {len(quotes)} quotes")
        
        # Extract and normalize metrics
        cost_per_kg_values = []
        carbon_per_kg_values = []
        
        for quote in quotes:
            cost_per_kg = quote["cost_usd"] / weight_kg
            carbon_per_kg = quote["carbon_breakdown"].total_co2_kg / weight_kg
            
            cost_per_kg_values.append(cost_per_kg)
            carbon_per_kg_values.append(carbon_per_kg)
        
        # Normalize values for fair comparison
        cost_scores = self._normalize_cost_scores(cost_per_kg_values)
        environmental_scores = self._normalize_environmental_scores(carbon_per_kg_values)
        
        # Calculate weighted scores and assign tiers
        scores = []
        for i, quote in enumerate(quotes):
            cost_effectiveness_score = cost_scores[i]
            environmental_score = environmental_scores[i]
            
            # Apply business-focused scoring logic
            weighted_score = self._apply_business_logic(
                quote,
                cost_effectiveness_score,
                environmental_score,
                i,
                len(quotes)
            )
            
            # Determine tier and explanation
            tier = self._determine_tier(weighted_score)
            explanation = self._generate_explanation(
                quote,
                cost_effectiveness_score,
                environmental_score,
                weighted_score,
                tier
            )
            
            score = EcoEfficiencyScore(
                points=round(weighted_score, 1),
                cost_effectiveness_score=round(cost_effectiveness_score, 2),
                environmental_score=round(environmental_score, 2),
                cost_per_kg=cost_per_kg_values[i],
                carbon_per_kg=carbon_per_kg_values[i],
                tier=tier,
                explanation=explanation
            )
            
            scores.append(score)
        
        logger.info(f"Eco-efficiency scoring completed. Point range: "
                   f"{min(s.points for s in scores):.1f} - {max(s.points for s in scores):.1f}")
        
        return scores
    
    def _normalize_cost_scores(self, cost_per_kg_values: List[float]) -> List[float]:
        """
        Normalize cost scores where lower cost = higher score.
        
        Args:
            cost_per_kg_values: List of cost per kg values
            
        Returns:
            List of normalized scores (0-1 range)
        """
        if not cost_per_kg_values:
            return []
        
        min_cost = min(cost_per_kg_values)
        max_cost = max(cost_per_kg_values)
        
        if max_cost == min_cost:
            return [1.0] * len(cost_per_kg_values)
        
        # Invert so lower cost = higher score
        normalized = []
        for cost in cost_per_kg_values:
            score = (max_cost - cost) / (max_cost - min_cost)
            normalized.append(score)
        
        return normalized
    
    def _normalize_environmental_scores(self, carbon_per_kg_values: List[float]) -> List[float]:
        """
        Normalize environmental scores where lower carbon = higher score.
        
        Args:
            carbon_per_kg_values: List of carbon per kg values
            
        Returns:
            List of normalized scores (0-1 range)
        """
        if not carbon_per_kg_values:
            return []
        
        min_carbon = min(carbon_per_kg_values)
        max_carbon = max(carbon_per_kg_values)
        
        if max_carbon == min_carbon:
            return [1.0] * len(carbon_per_kg_values)
        
        # Invert so lower carbon = higher score
        normalized = []
        for carbon in carbon_per_kg_values:
            score = (max_carbon - carbon) / (max_carbon - min_carbon)
            normalized.append(score)
        
        return normalized
    
    def _apply_business_logic(
        self,
        quote: Dict[str, Any],
        cost_score: float,
        env_score: float,
        quote_index: int,
        total_quotes: int
    ) -> float:
        """
        Apply business-focused scoring logic with specific adjustments.
        
        Args:
            quote: Quote data including service information
            cost_score: Normalized cost effectiveness score (0-1)
            env_score: Normalized environmental score (0-1)
            quote_index: Index of quote in sorted list (by priority)
            total_quotes: Total number of quotes
            
        Returns:
            Final weighted score (0-25 range)
        """
        # Base weighted score
        base_score = (cost_score * self.weights.cost_effectiveness + 
                     env_score * self.weights.environmental_impact)
        
        # Apply business logic adjustments
        service_name = quote.get("service_name", "")
        eta_hours = quote.get("eta_hours", 0)

        # Create significant point gap between fastest and second-fastest, but tighter gaps for medium-speed services
        if "Next Day Air Early" in service_name:
            # Most expensive express service gets penalty
            adjustment = -0.15  # Reduce by 15%
        elif "Next Day Air" in service_name and "Early" not in service_name:
            # Second fastest gets moderate penalty
            adjustment = -0.08  # Reduce by 8%
        elif "Next Day Air Saver" in service_name:
            # Medium-speed service: bring closer to other medium-speed services
            adjustment = 0.25   # Increase by 25% (much closer to other medium-speed services)
        elif "2nd Day Air" in service_name:
            # Medium-speed service: minimal difference from other medium-speed options
            adjustment = 0.28   # Increase by 28%
        elif "3-Day Select" in service_name:
            # Medium-speed service: slight boost but keep tight with others
            adjustment = 0.30   # Increase by 30%
        elif "Ground" in service_name:
            # Ground service: highest but much tighter gap with other medium-speed services
            adjustment = 0.32   # Increase by 32% (very tight gap with 3-Day Select)
        else:
            adjustment = 0.0

        # Apply adjustment
        adjusted_score = base_score * (1 + adjustment)

        # Scale to 0-25 point range (changed from 0-30)
        final_score = max(0, min(25, adjusted_score * 25))
        
        return final_score
    
    def _determine_tier(self, score: float) -> str:
        """
        Determine scoring tier based on point value.
        
        Args:
            score: Eco-efficiency score (0-25)
            
        Returns:
            Tier name
        """
        for tier, (min_points, max_points) in self.TIER_RANGES.items():
            if min_points <= score <= max_points:
                return tier
        
        return "unranked"
    
    def _generate_explanation(
        self,
        quote: Dict[str, Any],
        cost_score: float,
        env_score: float,
        final_score: float,
        tier: str
    ) -> str:
        """
        Generate human-readable explanation for the score.
        
        Args:
            quote: Quote data
            cost_score: Cost effectiveness score
            env_score: Environmental score
            final_score: Final weighted score
            tier: Scoring tier
            
        Returns:
            Explanation string
        """
        service_name = quote.get("service_name", "Unknown")
        
        # Determine primary strength
        if cost_score > env_score:
            primary_strength = "cost-effective"
            secondary_aspect = f"environmental score: {env_score:.2f}"
        else:
            primary_strength = "environmentally friendly"
            secondary_aspect = f"cost score: {cost_score:.2f}"
        
        # Generate tier-specific explanation
        tier_explanations = {
            "excellent": f"Outstanding balance of cost and environmental performance",
            "very_good": f"Strong {primary_strength} option with good overall value",
            "good": f"Moderate eco-friendly choice with reasonable cost trade-offs",
            "fair": f"Balanced medium-speed service option with competitive scoring",
            "poor": f"Express service with higher cost and environmental impact",
            "very_poor": f"Premium express service with significant cost and environmental trade-offs"
        }
        
        base_explanation = tier_explanations.get(tier, "Standard shipping option")
        
        return f"{base_explanation}. Cost effectiveness: {cost_score:.2f}, {secondary_aspect}."
    
    def get_scoring_summary(self, scores: List[EcoEfficiencyScore]) -> Dict[str, Any]:
        """
        Generate summary statistics for eco-efficiency scoring.
        
        Args:
            scores: List of calculated scores
            
        Returns:
            Dictionary with summary statistics
        """
        if not scores:
            return {}
        
        points = [s.points for s in scores]
        tiers = [s.tier for s in scores]
        
        # Find best scoring option
        best_score = max(scores, key=lambda s: s.points)
        
        # Count tiers
        tier_counts = {}
        for tier in tiers:
            tier_counts[tier] = tier_counts.get(tier, 0) + 1
        
        return {
            "point_range": {
                "min": min(points),
                "max": max(points),
                "average": sum(points) / len(points)
            },
            "best_eco_efficiency": {
                "service_name": best_score.explanation.split('.')[0],
                "points": best_score.points,
                "tier": best_score.tier
            },
            "tier_distribution": tier_counts,
            "scoring_methodology": {
                "cost_weight": f"{self.weights.cost_effectiveness:.0%}",
                "environmental_weight": f"{self.weights.environmental_impact:.0%}",
                "point_scale": "0-25 points",
                "business_focus": "Balances cost-effectiveness with environmental responsibility"
            }
        }
