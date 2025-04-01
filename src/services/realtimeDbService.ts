import { 
  ref, 
  set, 
  get, 
  update, 
  remove, 
  push, 
  query, 
  orderByChild, 
  equalTo, 
  onValue, 
  off, 
  DatabaseReference, 
  DataSnapshot 
} from 'firebase/database';
import { realtimeDb } from '../config/firebase';
import { User, Employee, Goal, Feedback, Department, PerformanceMetric } from '../types/models';

// Utility function to handle database errors
const handleDatabaseError = (error: any, operation: string): never => {
  // Check for index errors
  if (error.message && error.message.includes('Index not defined')) {
    const indexMatch = error.message.match(/add ".indexOn": "([^"]+)".*path "([^"]+)"/);
    if (indexMatch) {
      const [_, indexField, path] = indexMatch;
      console.error(`Firebase Database index error: Add ".indexOn": "${indexField}" for path "${path}" in your database rules.`);
      console.error(`To fix this, update your database.rules.json file with appropriate indexing rules.`);
    }
  }
  
  // Log the error with context
  console.error(`Database operation failed: ${operation}`, error);
  
  // Rethrow with useful information
  throw error;
};

// User Management
export const createUser = async (userId: string, userData: any): Promise<void> => {
  const userRef = ref(realtimeDb, `users/${userId}`);
  await set(userRef, userData);
};

export const getUserById = async (userId: string) => {
  const userRef = ref(realtimeDb, `users/${userId}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? snapshot.val() : null;
};

// Employee Management
export const getAllEmployees = async (): Promise<Employee[]> => {
  const employeesRef = ref(realtimeDb, 'employees');
  const snapshot = await get(employeesRef);
  
  if (!snapshot.exists()) return [];
  
  const employees = snapshot.val();
  return Object.keys(employees).map(key => ({
    ...employees[key],
    id: key
  }));
};

export const getEmployeeById = async (employeeId: string): Promise<Employee | null> => {
  const employeeRef = ref(realtimeDb, `employees/${employeeId}`);
  const snapshot = await get(employeeRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const getEmployeeByUserId = async (userId: string): Promise<Employee | null> => {
  try {
    const employeesRef = ref(realtimeDb, 'employees');
    const employeeQuery = query(employeesRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(employeeQuery);
    
    if (snapshot.exists()) {
      const employees = snapshot.val();
      const employeeId = Object.keys(employees)[0];
      return { ...employees[employeeId], id: employeeId };
    }
    
    return null;
  } catch (error) {
    return handleDatabaseError(error, `Get employee by userId: ${userId}`);
  }
};

// Fallback function that doesn't rely on indexed queries
export const getEmployeeByUserIdFallback = async (userId: string): Promise<Employee | null> => {
  try {
    // Get all employees
    const employeesRef = ref(realtimeDb, 'employees');
    const snapshot = await get(employeesRef);
    
    if (!snapshot.exists()) return null;
    
    // Manually filter to find the employee with matching userId
    const employees = snapshot.val();
    for (const employeeId in employees) {
      if (employees[employeeId].userId === userId) {
        return { ...employees[employeeId], id: employeeId };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error in getEmployeeByUserIdFallback:', error);
    throw error;
  }
};

export const createEmployee = async (employeeData: Omit<Employee, 'id'>): Promise<Employee> => {
  const employeesRef = ref(realtimeDb, 'employees');
  const newEmployeeRef = push(employeesRef);
  const employeeId = newEmployeeRef.key as string;
  
  const employee: Employee = {
    ...employeeData,
    id: employeeId,
    createdAt: employeeData.createdAt || new Date(),
    updatedAt: employeeData.updatedAt || new Date()
  };
  
  await set(newEmployeeRef, employee);
  return employee;
};

export const updateEmployee = async (employeeId: string, updates: Partial<Employee>): Promise<void> => {
  const employeeRef = ref(realtimeDb, `employees/${employeeId}`);
  await update(employeeRef, { ...updates, updatedAt: new Date() });
};

export const deleteEmployee = async (id: string): Promise<void> => {
  try {
    const employeeRef = ref(realtimeDb, `employees/${id}`);
    await remove(employeeRef);
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

// Goals Management
export const getGoalsByEmployeeId = async (employeeId: string): Promise<Goal[]> => {
  const goalsRef = ref(realtimeDb, 'goals');
  const goalQuery = query(goalsRef, orderByChild('employeeId'), equalTo(employeeId));
  const snapshot = await get(goalQuery);
  
  if (!snapshot.exists()) return [];
  
  const goals = snapshot.val();
  return Object.keys(goals).map(key => ({
    ...goals[key],
    id: key
  }));
};

export const getAllGoals = async (): Promise<Goal[]> => {
  try {
    const goalsRef = ref(realtimeDb, 'goals');
    const snapshot = await get(goalsRef);
    
    if (snapshot.exists()) {
      const goalsData = snapshot.val();
      return Object.keys(goalsData).map(key => ({
        id: key,
        ...goalsData[key]
      }));
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error getting all goals:', error);
    throw error;
  }
};

export const createGoal = async (goalData: Omit<Goal, 'id'>): Promise<Goal> => {
  const goalsRef = ref(realtimeDb, 'goals');
  const newGoalRef = push(goalsRef);
  const goalId = newGoalRef.key as string;
  
  const goal: Goal = {
    ...goalData,
    id: goalId,
    createdAt: goalData.createdAt || new Date(),
    updatedAt: goalData.updatedAt || new Date()
  };
  
  await set(newGoalRef, goal);
  return goal;
};

export const updateGoal = async (goalId: string, updates: Partial<Goal>): Promise<void> => {
  const goalRef = ref(realtimeDb, `goals/${goalId}`);
  await update(goalRef, { ...updates, updatedAt: new Date() });
};

export const deleteGoal = async (id: string): Promise<void> => {
  try {
    const goalRef = ref(realtimeDb, `goals/${id}`);
    await remove(goalRef);
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};

// Feedback Management
export const getFeedbacksByEmployeeId = async (employeeId: string): Promise<Feedback[]> => {
  const feedbacksRef = ref(realtimeDb, 'feedbacks');
  const feedbackQuery = query(feedbacksRef, orderByChild('employeeId'), equalTo(employeeId));
  const snapshot = await get(feedbackQuery);
  
  if (!snapshot.exists()) return [];
  
  const feedbacks = snapshot.val();
  return Object.keys(feedbacks).map(key => ({
    ...feedbacks[key],
    id: key
  }));
};

export const getAllFeedbacks = async (): Promise<Feedback[]> => {
  try {
    const feedbacksRef = ref(realtimeDb, 'feedbacks');
    const snapshot = await get(feedbacksRef);
    
    if (snapshot.exists()) {
      const feedbacksData = snapshot.val();
      return Object.keys(feedbacksData).map(key => ({
        id: key,
        ...feedbacksData[key]
      }));
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error getting all feedbacks:', error);
    throw error;
  }
};

export const createFeedback = async (feedbackData: Omit<Feedback, 'id'>): Promise<Feedback> => {
  const feedbacksRef = ref(realtimeDb, 'feedbacks');
  const newFeedbackRef = push(feedbacksRef);
  const feedbackId = newFeedbackRef.key as string;
  
  const feedback: Feedback = {
    ...feedbackData,
    id: feedbackId,
    createdAt: feedbackData.createdAt || new Date()
  };
  
  await set(newFeedbackRef, feedback);
  return feedback;
};

export const updateFeedback = async (id: string, data: Partial<Feedback>): Promise<void> => {
  try {
    const feedbackRef = ref(realtimeDb, `feedbacks/${id}`);
    await update(feedbackRef, data);
  } catch (error) {
    console.error('Error updating feedback:', error);
    throw error;
  }
};

export const deleteFeedback = async (id: string): Promise<void> => {
  try {
    const feedbackRef = ref(realtimeDb, `feedbacks/${id}`);
    await remove(feedbackRef);
  } catch (error) {
    console.error('Error deleting feedback:', error);
    throw error;
  }
};

// Real-time listeners
export const subscribeToEmployee = (
  employeeId: string, 
  callback: (employee: Employee | null) => void
): () => void => {
  const employeeRef = ref(realtimeDb, `employees/${employeeId}`);
  
  const handleSnapshot = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      callback({
        id: employeeId,
        ...snapshot.val()
      });
    } else {
      callback(null);
    }
  };
  
  onValue(employeeRef, handleSnapshot);
  
  // Return unsubscribe function
  return () => off(employeeRef);
};

export const subscribeToGoals = (employeeId: string, callback: (goals: Goal[]) => void) => {
  const goalsRef = ref(realtimeDb, 'goals');
  const goalQuery = query(goalsRef, orderByChild('employeeId'), equalTo(employeeId));
  
  const listener = onValue(goalQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const goals = snapshot.val();
    const formattedGoals = Object.keys(goals).map(key => ({
      ...goals[key],
      id: key
    }));
    
    callback(formattedGoals);
  });
  
  // Return a function to unsubscribe
  return () => off(goalQuery, 'value');
};

export const subscribeToFeedbacks = (employeeId: string, callback: (feedbacks: Feedback[]) => void) => {
  const feedbacksRef = ref(realtimeDb, 'feedbacks');
  const feedbackQuery = query(feedbacksRef, orderByChild('employeeId'), equalTo(employeeId));
  
  const listener = onValue(feedbackQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const feedbacks = snapshot.val();
    const formattedFeedbacks = Object.keys(feedbacks).map(key => ({
      ...feedbacks[key],
      id: key
    }));
    
    callback(formattedFeedbacks);
  });
  
  // Return a function to unsubscribe
  return () => off(feedbackQuery, 'value');
};

// Performance Metrics Management
export const createPerformanceMetric = async (metricData: Omit<PerformanceMetric, 'id'>): Promise<PerformanceMetric> => {
  const metricsRef = ref(realtimeDb, 'performanceMetrics');
  const newMetricRef = push(metricsRef);
  const metricId = newMetricRef.key as string;
  
  const metric: PerformanceMetric = {
    ...metricData,
    id: metricId,
    date: metricData.date || new Date()
  };
  
  await set(newMetricRef, metric);
  return metric;
};

export const getPerformanceMetricsByEmployeeId = async (employeeId: string): Promise<PerformanceMetric[]> => {
  const metricsRef = ref(realtimeDb, 'performanceMetrics');
  const metricsQuery = query(metricsRef, orderByChild('employeeId'), equalTo(employeeId));
  const snapshot = await get(metricsQuery);
  
  if (!snapshot.exists()) return [];
  
  const metrics = snapshot.val();
  return Object.keys(metrics).map(key => ({
    ...metrics[key],
    id: key
  }));
};

export const subscribeToPerformanceMetrics = (employeeId: string, callback: (metrics: PerformanceMetric[]) => void) => {
  const metricsRef = ref(realtimeDb, 'performanceMetrics');
  const metricsQuery = query(metricsRef, orderByChild('employeeId'), equalTo(employeeId));
  
  const listener = onValue(metricsQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const metrics = snapshot.val();
    const formattedMetrics = Object.keys(metrics).map(key => ({
      ...metrics[key],
      id: key
    }));
    
    callback(formattedMetrics);
  });
  
  // Return unsubscribe function
  return () => off(metricsQuery);
};