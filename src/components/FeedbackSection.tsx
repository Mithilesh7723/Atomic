import React from 'react';
import { MessageSquare, ChevronRight, Star } from 'lucide-react';
import { Feedback } from '../types/models';

interface FeedbackSectionProps {
  feedbacks: Feedback[];
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ feedbacks }) => {
  // Example feedbacks if none provided
  const defaultFeedbacks = [
    {
      id: '1',
      employeeId: '123',
      reviewerId: 'admin1',
      reviewerName: 'Alex Johnson',
      content: 'Great job on the recent project! Your attention to detail really made a difference.',
      rating: 5,
      category: 'praise' as 'praise' | 'improvement' | 'general' | 'performance review',
      createdAt: new Date()
    },
    {
      id: '2',
      employeeId: '123',
      reviewerId: 'admin2',
      reviewerName: 'Sam Taylor',
      content: 'Consider improving documentation for your code. It will help team members understand your work better.',
      rating: 4,
      category: 'improvement' as 'praise' | 'improvement' | 'general' | 'performance review',
      createdAt: new Date()
    },
    {
      id: '3',
      employeeId: '123',
      reviewerId: 'admin3',
      reviewerName: 'Jordan Rivera',
      content: "We'd like to see improvement in your time management skills. We noticed some deadlines being missed recently.",
      rating: 3,
      category: 'improvement' as 'praise' | 'improvement' | 'general' | 'performance review',
      createdAt: new Date()
    }
  ];

  // Use provided feedbacks or default ones if empty
  const displayFeedbacks = feedbacks.length ? feedbacks : defaultFeedbacks;

  // Get background class based on feedback category
  const getCategoryClass = (category: string) => {
    switch (category) {
      case 'praise':
        return 'bg-emerald-500/20';
      case 'improvement':
        return 'bg-amber-500/20';
      case 'performance review':
        return 'bg-blue-500/20';
      default:
        return 'bg-indigo-500/20';
    }
  };

  // Get icon based on feedback category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'praise':
        return <Star className="w-5 h-5 text-emerald-300" />;
      case 'improvement':
        return <ChevronRight className="w-5 h-5 text-amber-300" />;
      case 'performance review':
        return <Star className="w-5 h-5 text-blue-300" />;
      default:
        return <MessageSquare className="w-5 h-5 text-indigo-300" />;
    }
  };

  // Format date to be more readable
  const formatDate = (date: Date) => {
    if (!date) return '';
    
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
        <MessageSquare className="w-5 h-5 mr-2 text-indigo-300" />
        Recent Feedback
      </h2>
      
      {displayFeedbacks.length === 0 ? (
        <div className="glass p-6 rounded-xl text-center">
          <p className="text-white/70">No feedback received yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayFeedbacks.map((feedback) => (
            <div key={feedback.id} className="glass p-4 rounded-xl transition-all duration-300 hover:bg-white/10">
              <div className="flex items-start">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getCategoryClass(feedback.category)}`}>
                  {getCategoryIcon(feedback.category)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-white font-medium">{feedback.reviewerName}</h3>
                    <span className="text-white/50 text-sm">{formatDate(feedback.createdAt)}</span>
                  </div>
                  <p className="text-white/80 mb-2">{feedback.content}</p>
                  {feedback.rating > 0 && (
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackSection;