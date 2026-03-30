import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import json

class AnalyticsService:
    
    def analyze_session_scores(self, evaluations: list) -> dict:
        if not evaluations:
            return {}
        
        df = pd.DataFrame(evaluations)
        
        category_scores = {}
        if 'topic_covered' in df.columns and 'overall_score' in df.columns:
            category_scores = df.groupby('topic_covered')['overall_score'].mean().to_dict()
        
        scores = df['overall_score'].tolist() if 'overall_score' in df.columns else []
        
        return {
            "average_score": float(df['overall_score'].mean()) if 'overall_score' in df.columns else 0,
            "highest_score": float(df['overall_score'].max()) if 'overall_score' in df.columns else 0,
            "lowest_score": float(df['overall_score'].min()) if 'overall_score' in df.columns else 0,
            "score_trend": scores,
            "category_breakdown": {k: round(float(v), 2) for k, v in category_scores.items()},
            "weak_areas": [k for k, v in category_scores.items() if v < 5],
            "strong_areas": [k for k, v in category_scores.items() if v >= 7]
        }
    
    def analyze_multi_session_progress(self, all_sessions: list) -> dict:
        if len(all_sessions) < 2:
            return {"message": "Need at least 2 sessions for progress analysis"}
        
        session_averages = []
        for session in all_sessions:
            evals = session.get('evaluations', [])
            if evals:
                avg = np.mean([e.get('overall_score', 0) for e in evals])
                session_averages.append({
                    'session_number': session.get('session_number', 0),
                    'average_score': float(avg),
                    'date': session.get('created_at', '')
                })
        
        df = pd.DataFrame(session_averages)
        
        if len(df) >= 2:
            scores = df['average_score'].values
            slope = np.polyfit(range(len(scores)), scores, 1)[0]
            
            if slope > 0.3:
                trajectory = "improving"
            elif slope < -0.3:
                trajectory = "declining"
            else:
                trajectory = "stagnant"
        else:
            trajectory = "insufficient_data"
        
        all_weak = []
        for session in all_sessions:
            evals = session.get('evaluations', [])
            for e in evals:
                if e.get('overall_score', 10) < 5:
                    all_weak.append(e.get('topic_covered', 'unknown'))
        
        weak_counts = pd.Series(all_weak).value_counts().to_dict() if all_weak else {}
        persistent_weak = [k for k, v in weak_counts.items() if v >= 2]
        
        return {
            "trajectory": trajectory,
            "session_scores": session_averages,
            "persistent_weak_areas": persistent_weak,
            "weak_area_frequency": weak_counts,
            "latest_average": float(df['average_score'].iloc[-1]) if not df.empty else 0,
            "first_average": float(df['average_score'].iloc[0]) if not df.empty else 0,
            "total_improvement": float(df['average_score'].iloc[-1] - df['average_score'].iloc[0]) if len(df) >= 2 else 0
        }

analytics_service = AnalyticsService()
