from typing import List, Dict, Any
from collections import Counter
import logging

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Enhanced analytics service with professional interview scoring."""
    
    def analyze_session_scores(self, evaluations: list) -> dict:
        """Analyze a single session's scores with detailed breakdowns."""
        if not evaluations:
            return {
                "average_score": 0,
                "highest_score": 0,
                "lowest_score": 0,
                "score_trend": [],
                "category_breakdown": {},
                "weak_areas": [],
                "strong_areas": [],
                "dimension_averages": {},
                "answer_quality_distribution": {},
                "consistency_score": 0,
                "red_flags_count": 0,
            }
        
        # Extract scores
        scores = [e.get('overall_score', 0) for e in evaluations]
        
        # Category breakdown by topic
        category_scores = {}
        for e in evaluations:
            topic = e.get('topic_covered', 'general')
            if topic not in category_scores:
                category_scores[topic] = []
            category_scores[topic].append(e.get('overall_score', 0))
        
        category_averages = {k: sum(v)/len(v) for k, v in category_scores.items()}
        
        # Dimension averages (technical_accuracy, depth, etc.)
        dimension_totals = {}
        dimension_counts = {}
        for e in evaluations:
            scores_dict = e.get('scores', {})
            for dim, score in scores_dict.items():
                if dim not in dimension_totals:
                    dimension_totals[dim] = 0
                    dimension_counts[dim] = 0
                dimension_totals[dim] += score
                dimension_counts[dim] += 1
        
        dimension_averages = {
            dim: round(dimension_totals[dim] / dimension_counts[dim], 2)
            for dim in dimension_totals
            if dimension_counts[dim] > 0
        }
        
        # Answer quality distribution
        quality_dist = Counter(e.get('answer_quality', 'unknown') for e in evaluations)
        
        # Count red flags
        red_flags_count = sum(len(e.get('red_flags', [])) for e in evaluations)
        
        # Calculate consistency (lower variance = more consistent)
        if len(scores) > 1:
            mean_score = sum(scores) / len(scores)
            variance = sum((s - mean_score) ** 2 for s in scores) / len(scores)
            # Convert variance to a 0-10 score (lower variance = higher consistency)
            consistency_score = max(0, 10 - (variance ** 0.5))
        else:
            consistency_score = 5  # Neutral for single question
        
        return {
            "average_score": round(sum(scores) / len(scores), 2) if scores else 0,
            "highest_score": max(scores) if scores else 0,
            "lowest_score": min(scores) if scores else 0,
            "score_trend": scores,
            "category_breakdown": {k: round(v, 2) for k, v in category_averages.items()},
            "weak_areas": [k for k, v in category_averages.items() if v < 5],
            "strong_areas": [k for k, v in category_averages.items() if v >= 7],
            "dimension_averages": dimension_averages,
            "answer_quality_distribution": dict(quality_dist),
            "consistency_score": round(consistency_score, 2),
            "red_flags_count": red_flags_count,
            "questions_answered": len(evaluations),
            "questions_skipped": sum(1 for e in evaluations if e.get('answer_quality') == 'skipped'),
        }
    
    def calculate_overall_interview_score(self, evaluations: list, difficulty: str) -> dict:
        """
        Calculate final interview score with professional calibration.
        Returns score on 0-100 scale with grade and recommendation.
        """
        if not evaluations:
            return {"score": 0, "grade": "F", "recommendation": "No"}
        
        # Filter out skipped questions for main scoring
        answered_evals = [e for e in evaluations if e.get('answer_quality') != 'skipped']
        
        if not answered_evals:
            return {"score": 0, "grade": "F", "recommendation": "Strong No"}
        
        # Base score from question averages
        question_scores = [e.get('overall_score', 0) for e in answered_evals]
        base_score = sum(question_scores) / len(question_scores)
        
        # Penalty for skipped questions (5% per skip)
        skipped_count = len(evaluations) - len(answered_evals)
        skip_penalty = skipped_count * 5
        
        # Red flag penalty (3% per red flag)
        red_flags = sum(len(e.get('red_flags', [])) for e in evaluations)
        red_flag_penalty = red_flags * 3
        
        # Consistency bonus/penalty
        analytics = self.analyze_session_scores(evaluations)
        consistency = analytics.get('consistency_score', 5)
        consistency_modifier = (consistency - 5) * 2  # +/- up to 10%
        
        # Strong answer bonus
        strong_count = sum(1 for e in answered_evals if e.get('answer_quality') == 'strong')
        strong_bonus = strong_count * 3
        
        # Calculate final score (0-100 scale)
        raw_score = base_score * 10  # Convert 0-10 to 0-100
        final_score = raw_score - skip_penalty - red_flag_penalty + consistency_modifier + strong_bonus
        final_score = max(0, min(100, final_score))  # Clamp to 0-100
        
        # Difficulty calibration
        difficulty_thresholds = {
            "Internship": {"A": 75, "B": 60, "C": 45, "D": 30},
            "Junior": {"A": 80, "B": 65, "C": 50, "D": 35},
            "Mid-Level": {"A": 82, "B": 68, "C": 55, "D": 40},
            "Senior": {"A": 85, "B": 72, "C": 58, "D": 45},
            "Staff": {"A": 88, "B": 75, "C": 62, "D": 50},
            "Principal": {"A": 90, "B": 78, "C": 65, "D": 52},
        }
        
        thresholds = difficulty_thresholds.get(difficulty, difficulty_thresholds["Mid-Level"])
        
        # Determine grade
        if final_score >= thresholds["A"]:
            grade = "A"
            recommendation = "Strong Yes"
        elif final_score >= thresholds["B"]:
            grade = "B"
            recommendation = "Yes"
        elif final_score >= thresholds["C"]:
            grade = "C"
            recommendation = "Maybe"
        elif final_score >= thresholds["D"]:
            grade = "D"
            recommendation = "No"
        else:
            grade = "F"
            recommendation = "Strong No"
        
        return {
            "score": round(final_score, 1),
            "grade": grade,
            "recommendation": recommendation,
            "breakdown": {
                "base_score": round(raw_score, 1),
                "skip_penalty": skip_penalty,
                "red_flag_penalty": red_flag_penalty,
                "consistency_modifier": round(consistency_modifier, 1),
                "strong_answer_bonus": strong_bonus,
            }
        }
    
    def analyze_multi_session_progress(self, all_sessions: list) -> dict:
        """Analyze progress across multiple interview sessions."""
        if len(all_sessions) < 2:
            return {"message": "Need at least 2 sessions for progress analysis"}
        
        session_data = []
        for idx, session in enumerate(all_sessions):
            evals = session.get('evaluations', [])
            if evals:
                scores = [e.get('overall_score', 0) for e in evals]
                session_data.append({
                    'session_number': idx + 1,
                    'average_score': sum(scores) / len(scores),
                    'questions_count': len(evals),
                    'date': session.get('created_at', ''),
                    'difficulty': session.get('difficulty', 'Unknown'),
                })
        
        if len(session_data) < 2:
            return {"message": "Insufficient data for progress analysis"}
        
        scores = [s['average_score'] for s in session_data]
        
        # Calculate trend (simple linear regression)
        n = len(scores)
        x_mean = (n - 1) / 2
        y_mean = sum(scores) / n
        
        numerator = sum((i - x_mean) * (scores[i] - y_mean) for i in range(n))
        denominator = sum((i - x_mean) ** 2 for i in range(n))
        
        slope = numerator / denominator if denominator != 0 else 0
        
        if slope > 0.3:
            trajectory = "improving"
        elif slope < -0.3:
            trajectory = "declining"
        else:
            trajectory = "stable"
        
        # Find persistent weak areas
        all_weak = []
        for session in all_sessions:
            evals = session.get('evaluations', [])
            for e in evals:
                if e.get('overall_score', 10) < 5:
                    all_weak.append(e.get('topic_covered', 'unknown'))
        
        weak_counts = Counter(all_weak)
        persistent_weak = [k for k, v in weak_counts.items() if v >= 2]
        
        improvement = scores[-1] - scores[0] if len(scores) >= 2 else 0
        
        return {
            "trajectory": trajectory,
            "session_scores": session_data,
            "persistent_weak_areas": persistent_weak,
            "weak_area_frequency": dict(weak_counts),
            "latest_average": round(scores[-1], 2),
            "first_average": round(scores[0], 2),
            "total_improvement": round(improvement, 2),
            "improvement_rate_per_session": round(slope, 2),
            "total_sessions": len(session_data),
        }

analytics_service = AnalyticsService()
