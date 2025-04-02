export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'employee';
  photoURL?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  performanceScore?: number;
  goals?: Goal[];
  feedbacks?: Feedback[];
  metrics?: {
    communication: number;
    teamwork: number;
    technicalSkills: number;
    [key: string]: number;
  };
  userId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  photoURL?: string;
  address?: string;
  phoneNumber?: string;
  birthDate?: string;
  bio?: string;
  emergencyContact?: string;
}

export interface Goal {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  targetDate: Date | string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Feedback {
  id: string;
  employeeId: string;
  reviewerId: string;
  reviewerName: string;
  content: string;
  rating: number;
  category: string;
  createdAt: Date | string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface PerformanceMetric {
  id: string;
  employeeId: string;
  metric: string;
  value: number;
  date: Date | string;
} 