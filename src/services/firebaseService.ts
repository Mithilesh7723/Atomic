import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Employee, Goal, Feedback, Department, PerformanceMetric, User } from '../types/models';
import { createUser } from './realtimeDbService';

// User Management
export const registerUser = async (
  email: string,
  password: string,
  role: 'admin' | 'employee',
  displayName: string
) => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with display name
    await updateProfile(user, { displayName });

    // Create user profile in Realtime Database
    await createUser(user.uid, {
      uid: user.uid,
      email: user.email,
      displayName,
      role,
      photoURL: user.photoURL,
    });

    return user;
  } catch (error: any) {
    console.error("Error in registerUser:", error);
    
    // Re-throw the error to be handled by the caller
    throw error;
  }
};

// Login user
export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Logout user
export const logoutUser = async () => {
  await signOut(auth);
};

// Employee Management
export const getEmployees = async (): Promise<Employee[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'employees'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Employee[];
  } catch (error) {
    console.error('Error getting employees:', error);
    throw error;
  }
};

export const getEmployee = async (id: string): Promise<Employee | null> => {
  try {
    const docRef = doc(db, 'employees', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Employee;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting employee:', error);
    throw error;
  }
};

export const addEmployee = async (employee: Omit<Employee, 'id'>): Promise<Employee> => {
  try {
    const docRef = await addDoc(collection(db, 'employees'), {
      ...employee,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { 
      id: docRef.id, 
      ...employee 
    };
  } catch (error) {
    console.error('Error adding employee:', error);
    throw error;
  }
};

export const updateEmployee = async (id: string, data: Partial<Employee>): Promise<void> => {
  try {
    const employeeRef = doc(db, 'employees', id);
    await updateDoc(employeeRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

export const deleteEmployee = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'employees', id));
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

// Goal Management
export const getGoals = async (employeeId?: string): Promise<Goal[]> => {
  try {
    let goalsQuery;
    
    if (employeeId) {
      goalsQuery = query(collection(db, 'goals'), where('employeeId', '==', employeeId));
    } else {
      goalsQuery = collection(db, 'goals');
    }
    
    const querySnapshot = await getDocs(goalsQuery);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert Firestore timestamps to JavaScript dates
      return {
        id: doc.id,
        ...data,
        targetDate: data.targetDate instanceof Timestamp ? data.targetDate.toDate() : data.targetDate,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      } as Goal;
    });
  } catch (error) {
    console.error('Error getting goals:', error);
    throw error;
  }
};

export const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> => {
  try {
    const docRef = await addDoc(collection(db, 'goals'), {
      ...goal,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { 
      id: docRef.id, 
      ...goal,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error adding goal:', error);
    throw error;
  }
};

export const updateGoal = async (id: string, data: Partial<Goal>): Promise<void> => {
  try {
    const goalRef = doc(db, 'goals', id);
    await updateDoc(goalRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
};

export const deleteGoal = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'goals', id));
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};

// Feedback Management
export const getFeedbacks = async (employeeId?: string): Promise<Feedback[]> => {
  try {
    let feedbacksQuery;
    
    if (employeeId) {
      feedbacksQuery = query(collection(db, 'feedbacks'), where('employeeId', '==', employeeId));
    } else {
      feedbacksQuery = collection(db, 'feedbacks');
    }
    
    const querySnapshot = await getDocs(feedbacksQuery);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      } as Feedback;
    });
  } catch (error) {
    console.error('Error getting feedbacks:', error);
    throw error;
  }
};

export const addFeedback = async (feedback: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> => {
  try {
    const docRef = await addDoc(collection(db, 'feedbacks'), {
      ...feedback,
      createdAt: serverTimestamp()
    });
    
    return { 
      id: docRef.id, 
      ...feedback,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Error adding feedback:', error);
    throw error;
  }
};

export const updateFeedback = async (id: string, data: Partial<Feedback>): Promise<void> => {
  try {
    const feedbackRef = doc(db, 'feedbacks', id);
    await updateDoc(feedbackRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    throw error;
  }
};

export const deleteFeedback = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'feedbacks', id));
  } catch (error) {
    console.error('Error deleting feedback:', error);
    throw error;
  }
};

// Department Management
export const getDepartments = async (): Promise<Department[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'departments'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Department[];
  } catch (error) {
    console.error('Error getting departments:', error);
    throw error;
  }
};

export const addDepartment = async (department: Omit<Department, 'id'>): Promise<Department> => {
  try {
    const docRef = await addDoc(collection(db, 'departments'), department);
    return { id: docRef.id, ...department };
  } catch (error) {
    console.error('Error adding department:', error);
    throw error;
  }
};

// Performance Metrics
export const getPerformanceMetrics = async (employeeId: string): Promise<PerformanceMetric[]> => {
  try {
    const metricsQuery = query(
      collection(db, 'performanceMetrics'), 
      where('employeeId', '==', employeeId)
    );
    
    const querySnapshot = await getDocs(metricsQuery);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
      } as PerformanceMetric;
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    throw error;
  }
};

export const addPerformanceMetric = async (metric: Omit<PerformanceMetric, 'id'>): Promise<PerformanceMetric> => {
  try {
    const docRef = await addDoc(collection(db, 'performanceMetrics'), {
      ...metric,
      createdAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...metric };
  } catch (error) {
    console.error('Error adding performance metric:', error);
    throw error;
  }
}; 