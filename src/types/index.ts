export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  avatar: string;
}

export interface PerformanceGoal {
  id: string;
  title: string;
  description: string;
  progress: number;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface FeedbackItem {
  id: string;
  from: string;
  to: string;
  content: string;
  type: 'praise' | 'improvement' | 'general';
  createdAt: string;
}

export interface PerformanceMetric {
  category: string;
  score: number;
  maxScore: number;
}