import { useState, useEffect, useCallback } from 'react';
import { CONSTANTS } from '../constants';

export function useLearningProgress() {
  const [learningProgress, setLearningProgress] = useState({});
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  // Load learning progress from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSTANTS.LEARNING_PROGRESS_KEY);
      const progress = stored ? JSON.parse(stored) : {};
      setLearningProgress(progress);
      setEnrolledCourses(Object.keys(progress));
    } catch (error) {
      
      setLearningProgress({});
      setEnrolledCourses([]);
    }
  }, []);

  // Save learning progress to localStorage
  useEffect(() => {
    localStorage.setItem(CONSTANTS.LEARNING_PROGRESS_KEY, JSON.stringify(learningProgress));
  }, [learningProgress]);

  // Handle enroll course
  const handleEnrollCourse = useCallback((courseId) => {
    if (!enrolledCourses.includes(courseId)) {
      setEnrolledCourses(prev => [...prev, courseId]);
      setLearningProgress(prev => ({
        ...prev,
        [courseId]: {
          enrolled: true,
          enrolledAt: new Date().toISOString(),
          completedModules: [],
          overallProgress: 0
        }
      }));
    }
  }, [enrolledCourses]);

  // Handle module complete
  const handleModuleComplete = useCallback((courseId, moduleId, entries) => {
    setLearningProgress(prev => {
      const courseProgress = prev[courseId] || { completedModules: [], overallProgress: 0 };
      const completedModules = [...new Set([...courseProgress.completedModules, moduleId])];
      const course = entries.find(e => e.id === courseId);
      const overallProgress = course ? (completedModules.length / course.modules.length) * 100 : 0;
      
      return {
        ...prev,
        [courseId]: {
          ...courseProgress,
          completedModules,
          overallProgress,
          lastUpdated: new Date().toISOString()
        }
      };
    });
  }, []);

  // Get course progress
  const getCourseProgress = useCallback((courseId) => {
    return learningProgress[courseId] || { enrolled: false, completedModules: [], overallProgress: 0 };
  }, [learningProgress]);

  // Get learning stats
  const getLearningStats = useCallback((entries) => {
    const learningEntries = entries.filter(entry => 
      ['course', 'tutorial', 'video', 'article'].includes(entry.type)
    );
    const learningEntryIds = new Set(learningEntries.map((entry) => entry.id));
    const activeProgressEntries = Object.entries(learningProgress).filter(([courseId]) => learningEntryIds.has(courseId));
    
    const enrolledCount = activeProgressEntries.length;
    const completedCourses = activeProgressEntries.filter(([, progress]) => progress.overallProgress === 100).length;
    const totalLearningTime = learningEntries.reduce((total, entry) => {
      const duration = parseInt(entry.duration) || 0;
      return total + duration;
    }, 0);
    
    return {
      totalCourses: learningEntries.length,
      enrolledCount,
      completedCourses,
      totalLearningTime,
      inProgress: enrolledCount - completedCourses
    };
  }, [learningProgress]);

  return {
    learningProgress,
    enrolledCourses,
    handleEnrollCourse,
    handleModuleComplete,
    getCourseProgress,
    getLearningStats
  };
}


