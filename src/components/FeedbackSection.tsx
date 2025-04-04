import React, { useState } from 'react';
import { MessageSquare, ChevronRight, Star, Trash2, X } from 'lucide-react';
import { Feedback } from '../types/models';

interface FeedbackSectionProps {
  feedbacks: Feedback[];
  onClearFeedback?: (feedbackId: string) => void;
  onClearAllFeedback?: () => void;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ feedbacks, onClearFeedback, onClearAllFeedback }) => {
  const [hoveredFeedback, setHoveredFeedback] = useState<string | null>(null);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<Feedback[]>(feedbacks);

  // Use React state for feedbacks to handle optimistic UI updates
  React.useEffect(() => {
    setFeedbackItems(feedbacks);
  }, [feedbacks]);

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

  // Handle clearing a feedback item with optimistic UI update
  const handleClearFeedback = (feedbackId: string) => {
    // Optimistically remove from UI
    setFeedbackItems(prevFeedbacks => 
      prevFeedbacks.filter(feedback => feedback.id !== feedbackId)
    );
    
    // Call the parent handler if provided
    if (onClearFeedback) {
      onClearFeedback(feedbackId);
    }
  };

  // Handle clearing all feedback with optimistic UI update
  const handleClearAllFeedback = () => {
    // Optimistically clear all feedback
    setFeedbackItems([]);
    
    // Call the parent handler if provided
    if (onClearAllFeedback) {
      onClearAllFeedback();
    }
  };

  // Toggle expanded state for a feedback
  const toggleExpandFeedback = (feedbackId: string) => {
    setExpandedFeedback(prev => prev === feedbackId ? null : feedbackId);
  };

  return (
    <div className="glass-card p-6 overflow-hidden relative">
      {/* Top highlight glow effect */}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-1/2 h-2 bg-indigo-500/30 blur-xl rounded-full animate-pulse-slow" />
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center group">
          <MessageSquare className="w-5 h-5 mr-2 text-indigo-300 group-hover:text-indigo-200 transition-colors" />
          <span className="group-hover:text-indigo-200 transition-colors">Recent Feedback</span>
        </h2>
        
        {feedbackItems.length > 0 && (
          <button
            onClick={handleClearAllFeedback}
            className="glass-button text-xs py-1 px-3 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear All
          </button>
        )}
      </div>
      
      {feedbackItems.length === 0 ? (
        <div className="glass p-6 rounded-xl text-center animate-fade-in">
          <p className="text-white/70">No feedback received yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbackItems.map((feedback) => (
            <div 
              key={feedback.id} 
              className={`glass p-4 rounded-xl transition-all duration-300 ${
                hoveredFeedback === feedback.id 
                  ? 'bg-white/10 transform scale-[1.01] shadow-lg shadow-indigo-500/10' 
                  : 'hover:bg-white/5'
              } ${expandedFeedback === feedback.id ? 'bg-white/5' : ''}`}
              onMouseEnter={() => setHoveredFeedback(feedback.id)}
              onMouseLeave={() => setHoveredFeedback(null)}
            >
              <div className="flex items-start">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getCategoryClass(feedback.category)} transition-transform ${hoveredFeedback === feedback.id ? 'scale-110' : ''}`}>
                  {getCategoryIcon(feedback.category)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-white font-medium flex items-center">
                      {feedback.reviewerName}
                      <span 
                        className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getCategoryClass(feedback.category)} transition-opacity ${hoveredFeedback === feedback.id ? 'opacity-100' : 'opacity-70'}`}
                      >
                        {feedback.category.replace('-', ' ')}
                      </span>
                    </h3>
                    <div className="flex items-center">
                      <span className="text-white/50 text-sm mr-3">{formatDate(feedback.createdAt)}</span>
                      <button 
                        onClick={() => handleClearFeedback(feedback.id)}
                        className="text-white/40 hover:text-red-400 transition-colors rounded-full p-1 hover:bg-white/10"
                        aria-label="Clear feedback"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div 
                    className={`text-white/80 relative transition-all duration-300 ${
                      expandedFeedback === feedback.id || feedback.content.length < 120 
                        ? '' 
                        : 'line-clamp-2'
                    }`}
                  >
                    <p className="mb-2">{feedback.content}</p>
                    
                    {feedback.content.length >= 120 && expandedFeedback !== feedback.id && (
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-indigo-900/80 pointer-events-none" />
                    )}
                  </div>
                  
                  {feedback.content.length >= 120 && (
                    <button 
                      onClick={() => toggleExpandFeedback(feedback.id)}
                      className="text-indigo-300 hover:text-indigo-200 text-xs mt-1 transition-colors"
                    >
                      {expandedFeedback === feedback.id ? 'Show less' : 'Read more'}
                    </button>
                  )}
                  
                  {feedback.rating > 0 && (
                    <div className="flex mt-3 animate-fade-in">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 transition-all duration-300 ${
                            i < feedback.rating 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-white/20'
                          } ${hoveredFeedback === feedback.id ? 'scale-110' : ''}`} 
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