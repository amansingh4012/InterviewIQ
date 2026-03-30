export interface ParsedResume {
  candidate_name: string;
  education: {
    degree: string;
    institution: string;
    cgpa: string;
    graduation_year: string;
  };
  technical_skills: {
    languages: string[];
    frontend: string[];
    backend: string[];
    databases: string[];
    ai_ml: string[];
    tools: string[];
    cloud: string[];
  };
  projects: Project[];
  strongest_areas: string[];
  potential_weak_areas: string[];
}

export interface Project {
  name: string;
  description: string;
  tech_stack: string[];
  key_features: string[];
  complexity_level: string;
  has_ai_integration: boolean;
  interview_worthy_points: string[];
}

export interface InterviewSession {
  session_id: string;
  question: string;
  question_number: number;
  status: 'active' | 'complete';
}

export interface EvaluationPreview {
  score: number;
  quality: 'strong' | 'acceptable' | 'weak' | 'very_weak';
}

export interface Report {
  overall_score: number;
  overall_grade: string;
  hire_recommendation: string;
  category_scores: {
    technical_knowledge: number;
    project_depth: number;
    system_design: number;
    problem_solving: number;
    communication: number;
    dsa_fundamentals: number;
  };
  strengths: Array<{ area: string; evidence: string; score: number }>;
  weaknesses: Array<{
    area: string;
    specific_gap: string;
    what_was_said: string;
    what_should_have_been_said: string;
    score: number;
  }>;
  question_by_question: Array<{
    question: string;
    answer_summary: string;
    score: number;
    feedback: string;
  }>;
  study_recommendations: Array<{
    topic: string;
    why: string;
    resource: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  biggest_win: string;
  most_critical_gap: string;
  one_thing_to_fix_immediately: string;
}

export type Role = 'Full Stack Developer' | 'Frontend Developer' | 'Backend Developer' | 'AI/ML Engineer';
export type Difficulty = 'Internship' | 'Junior' | 'Mid-level' | 'Senior';
export type InterviewType = 'Technical' | 'Behavioral' | 'Mixed' | 'System Design';
