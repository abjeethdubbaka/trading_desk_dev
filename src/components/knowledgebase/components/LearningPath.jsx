import React from 'react';

export function LearningPath() {
  const learningPaths = [
    { level: 'Beginner', courses: ['ta-001', 'rm-001'], completed: 0 },
    { level: 'Intermediate', courses: ['ta-002', 'tp-001'], completed: 0 },
    { level: 'Advanced', courses: ['sd-001'], completed: 0 }
  ];

  return (
    <div className="glass-card rounded-xl p-6 mb-6">
      <h2 className="text-xl font-bold text-white mb-4">Your Learning Path</h2>
      <div className="space-y-4">
        {learningPaths.map((path, index) => (
          <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-white">{path.level} Level</h3>
              <span className="text-sm text-gray-400">{path.completed}/{path.courses.length} completed</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${(path.completed / path.courses.length) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
