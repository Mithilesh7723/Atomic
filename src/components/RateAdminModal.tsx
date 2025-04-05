import React, { useState, useEffect } from 'react';
import { Star, X, Send, User, Loader2 } from 'lucide-react';
import { getAllEmployees } from '../services/realtimeDbService';

interface RateAdminModalProps {
  employeeId: string;
  onClose: () => void;
  onSubmit: (adminId: string, ratings: {
    leadership: number;
    communication: number;
    supportiveness: number;
    technicalGuidance: number;
  }, comment: string) => Promise<void>;
}

const RateAdminModal: React.FC<RateAdminModalProps> = ({ employeeId, onClose, onSubmit }) => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [leadershipRating, setLeadershipRating] = useState<number>(3);
  const [communicationRating, setCommunicationRating] = useState<number>(3);
  const [supportivenessRating, setSupportivenessRating] = useState<number>(3);
  const [technicalRating, setTechnicalRating] = useState<number>(3);
  const [comment, setComment] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: string }>({
    show: false, message: '', type: ''
  });

  useEffect(() => {
    const fetchAdmins = async () => {
      setIsLoading(true);
      try {
        const employees = await getAllEmployees();
        // Filter to find admins and team leaders
        const adminsList = employees.filter(emp => 
          emp.role === 'admin' || 
          emp.position?.toLowerCase().includes('lead') || 
          emp.position?.toLowerCase().includes('manager')
        );
        setAdmins(adminsList);
      } catch (error) {
        console.error('Error fetching admins:', error);
        setNotification({
          show: true,
          message: 'Failed to load admin/team leader list',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAdmin) {
      setNotification({
        show: true,
        message: 'Please select a team leader or manager to rate',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(selectedAdmin, {
        leadership: leadershipRating,
        communication: communicationRating,
        supportiveness: supportivenessRating,
        technicalGuidance: technicalRating
      }, comment);
      
      setNotification({
        show: true,
        message: 'Rating submitted successfully',
        type: 'success'
      });
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error submitting admin rating:', error);
      setNotification({
        show: true,
        message: 'Failed to submit rating',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingStars = (value: number, onChange: (value: number) => void, label: string) => (
    <div>
      <label className="block text-sm font-medium text-white/80 mb-1">{label}</label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 ${
              value >= star ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Star className={`w-4 h-4 ${value >= star ? 'fill-yellow-400' : ''}`} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-card max-w-md w-full p-1 animate-scale-in">
        <div className="rounded-xl p-6 relative overflow-hidden">
          {/* Shimmering border effect */}
          <div className="absolute inset-0 animated-gradient opacity-20"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                  <User className="w-6 h-6 text-indigo-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Rate Team Leadership</h3>
              </div>
              <button 
                onClick={onClose} 
                className="text-white/70 hover:text-white rounded-full hover:bg-white/10 p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {notification.show && (
              <div className={`mb-4 p-3 ${notification.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'} border rounded-lg text-white text-sm flex items-center`}>
                {notification.type === 'success' ? (
                  <Star className="w-5 h-5 text-yellow-400 mr-2" />
                ) : (
                  <X className="w-5 h-5 text-red-400 mr-2" />
                )}
                <span>{notification.message}</span>
              </div>
            )}
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
                <p className="text-white/60">Loading team leaders...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Select Team Leader/Manager</label>
                  <select 
                    value={selectedAdmin} 
                    onChange={(e) => setSelectedAdmin(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl glass-input focus:scale-[1.01] transition-all duration-300"
                    required
                  >
                    <option value="">Choose a team leader to rate</option>
                    {admins.map(admin => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name} - {admin.position}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="glass p-4 rounded-xl">
                  {renderRatingStars(leadershipRating, setLeadershipRating, "Leadership")}
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="glass p-4 rounded-xl">
                    {renderRatingStars(communicationRating, setCommunicationRating, "Communication")}
                  </div>
                  
                  <div className="glass p-4 rounded-xl">
                    {renderRatingStars(supportivenessRating, setSupportivenessRating, "Supportiveness")}
                  </div>
                  
                  <div className="glass p-4 rounded-xl">
                    {renderRatingStars(technicalRating, setTechnicalRating, "Technical Guidance")}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Additional Comments</label>
                  <div className="relative">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-input focus:scale-[1.01] transition-all duration-300"
                      rows={4}
                      placeholder="What's working well or how can they improve?"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button 
                    type="button" 
                    onClick={onClose} 
                    className="text-white/70 hover:text-white glass-button py-2 px-4 rounded-lg mr-2"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg flex items-center transition-colors"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Rating
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateAdminModal; 