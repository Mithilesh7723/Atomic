import React, { useState, useEffect } from 'react';
import { ref, set, get } from 'firebase/database';
import { database, auth } from '../config/firebase';
import { Rating } from '@mui/material';

const RatingSystem = () => {
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [ratings, setRatings] = useState<{[key: string]: number}>({});

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      const users = Object.entries(snapshot.val())
        .filter(([_, user]: [string, any]) => 
          user.role === 'admin' || user.role === 'teamleader')
        .map(([id, user]) => ({ id, ...user }));
      setSupervisors(users);
    }
  };

  const handleRating = async (supervisorId: string, newValue: number) => {
    if (!auth.currentUser) return;
    
    await set(ref(database, `ratings/${supervisorId}/${auth.currentUser.uid}`), {
      rating: newValue,
      timestamp: Date.now()
    });
    
    setRatings({ ...ratings, [supervisorId]: newValue });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Rate Your Supervisors</h2>
      {supervisors.map(supervisor => (
        <div key={supervisor.id} className="mb-4 p-3 border rounded">
          <p className="font-semibold">{supervisor.name} ({supervisor.role})</p>
          <Rating
            value={ratings[supervisor.id] || 0}
            onChange={(_, newValue) => handleRating(supervisor.id, newValue || 0)}
          />
        </div>
      ))}
    </div>
  );
};

export default RatingSystem;
