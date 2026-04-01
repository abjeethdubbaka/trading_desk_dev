import React from 'react';
import { FiBookOpen, FiPlay, FiAward, FiClock } from 'react-icons/fi';

export function LearningStats({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <FiBookOpen className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Courses</p>
            <p className="text-2xl font-bold text-white">{stats.totalCourses}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <FiPlay className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Enrolled</p>
            <p className="text-2xl font-bold text-white">{stats.enrolledCount}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <FiAward className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-white">{stats.completedCourses}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <FiClock className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Hours</p>
            <p className="text-2xl font-bold text-white">{stats.totalLearningTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
}


