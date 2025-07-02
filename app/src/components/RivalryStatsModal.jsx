import React from 'react';
import Modal from './Modal';

/**
 * RivalryStatsModal - Professional stats display
 * Props:
 *   open: boolean
 *   onClose: function()
 *   stats: object // rivalry stats to display
 */
export default function RivalryStatsModal({ open, onClose, stats }) {
  if (!stats) return null;
  
  return (
    <Modal open={open} onClose={onClose} title="🏆 Rivalry Statistics">
      <div className="space-y-4">
        {/* Teams Header */}
        <div className="text-center p-4 bg-base-300 rounded-lg border border-base-200">
          <div className="text-lg font-semibold text-primary-content">
            {stats.team1_name} <span className="text-base-content/60">vs</span> {stats.team2_name}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-base-100 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-success">{stats.avg_margin}</div>
            <div className="text-sm text-base-content/70">Avg Margin</div>
          </div>
          
          <div className="bg-base-100 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-info">{stats.last_10.length}</div>
            <div className="text-sm text-base-content/70">Games Played</div>
          </div>
        </div>

        {/* Recent Results */}
        <div className="bg-base-300 p-4 rounded-lg">
          <div className="text-sm font-semibold text-base-content mb-2">Last 10 Results</div>
          <div className="flex space-x-1">
            {stats.last_10.split('').map((result, index) => (
              <div 
                key={index}
                className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                  result === 'W' 
                    ? 'bg-success text-success-content' 
                    : 'bg-error text-error-content'
                }`}
              >
                {result}
              </div>
            ))}
          </div>
        </div>

        {/* Win Margins */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-warning/20 p-3 rounded-lg">
            <div className="text-lg font-bold text-warning">{stats.min_win}</div>
            <div className="text-sm text-base-content/70">Closest Win</div>
          </div>
          
          <div className="bg-secondary/20 p-3 rounded-lg">
            <div className="text-lg font-bold text-secondary">{stats.max_win}</div>
            <div className="text-sm text-base-content/70">Biggest Win</div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button 
            onClick={onClose}
            className="btn btn-primary w-full py-3"
          >
            Close Statistics
          </button>
        </div>
      </div>
    </Modal>
  );
}
