import React from 'react';
import { BADGES } from '../constants/badges';

const PlateCard = ({ 
  plate, 
  rank, 
  theme = 'light', // 'light' or 'dark'
  showBreakdown = false,
  onDelete,
  onAddToHallOfFame
}) => {
  const isDark = theme === 'dark';
  const score = parseFloat(plate.score || 0);

  // Color Logic
  let scoreColorClass = 'text-rose-500';
  let scoreBorderClass = 'border-rose-500';
  if (score >= 9) {
    scoreColorClass = isDark ? 'text-yellow-400' : 'text-emerald-600';
    scoreBorderClass = isDark ? 'border-yellow-400' : 'border-emerald-500';
  } else if (score >= 7) {
    scoreColorClass = isDark ? 'text-emerald-400' : 'text-emerald-500';
    scoreBorderClass = 'border-emerald-500';
  } else if (score >= 5) {
    scoreColorClass = 'text-amber-500';
    scoreBorderClass = 'border-amber-500';
  }

  // Container Styles
  let containerClass = isDark 
    ? "bg-slate-800 border-slate-700 hover:border-rose-500/50 text-white"
    : "bg-white border-slate-100 hover:shadow-md text-slate-900";

  // Rank Styling (Light theme only)
  if (!isDark && rank && score > 0) {
    if (rank === 1) containerClass = "bg-white border-yellow-400 ring-4 ring-yellow-50 shadow-xl transform scale-[1.02] z-10 text-slate-900";
    else if (rank === 2) containerClass = "bg-white border-slate-300 ring-2 ring-slate-50 shadow-lg text-slate-900";
    else if (rank === 3) containerClass = "bg-white border-amber-600 ring-2 ring-amber-50 shadow-lg text-slate-900";
  }

  return (
    <div className={`rounded-2xl border overflow-hidden transition relative group ${containerClass} shadow-sm`}>
      
      {/* Image Section */}
      <div className="h-56 relative overflow-hidden bg-slate-100">
        {plate.photoUrl ? (
          <img src={plate.photoUrl} alt={plate.name} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-300">
            <i className="fas fa-image text-4xl"></i>
          </div>
        )}

        {/* Rank Badge */}
        {rank && (
          <div className={`absolute top-0 left-0 px-3 py-1 rounded-br-xl font-bold backdrop-blur-sm shadow-sm z-20 ${
            rank === 1 ? 'bg-yellow-400 text-white' :
            rank === 2 ? 'bg-slate-400 text-white' :
            rank === 3 ? 'bg-amber-600 text-white' :
            'bg-black/60 text-white border-r border-b border-white/10'
          }`}>
            {rank === 1 && <i className="fas fa-trophy mr-1 text-yellow-100"></i>}
            {rank === 2 && <i className="fas fa-medal mr-1 text-slate-200"></i>}
            {rank === 3 && <i className="fas fa-medal mr-1 text-amber-200"></i>}
            #{rank}
          </div>
        )}

        {/* Timestamp */}
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
          {plate.submittedAt?.seconds 
            ? new Date(plate.submittedAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
            : 'Just now'}
        </div>

        {/* Delete Button */}
        {onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(plate.id || plate.uid); }}
            className="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-rose-600 text-white rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
            title="Delete Plate"
          >
            <i className="fas fa-trash-alt text-xs"></i>
          </button>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className={`font-bold truncate pr-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{plate.name}</h3>
          <div className={`text-2xl font-bold ${scoreColorClass}`}>
            {score.toFixed(1)}
          </div>
        </div>

        {/* Badges */}
        {plate.badges && plate.badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {plate.badges.map(badgeName => {
              const b = BADGES.find(x => x.name === badgeName);
              if (!b) return null;
              return (
                <span key={badgeName} title={badgeName} className={`text-[10px] px-2 py-1 rounded-full border flex items-center ${isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                  <i className={`${b.icon} mr-1 ${b.color || ''}`}></i>
                  {b.name}
                </span>
              );
            })}
          </div>
        )}

        {/* Breakdown Grid (Optional) */}
        {showBreakdown && plate.breakdown && (
          <div className="grid grid-cols-4 gap-1 mt-3 pt-3 border-t border-slate-100/10 text-center text-[10px] uppercase tracking-wider">
            {Object.entries(plate.breakdown).map(([key, val]) => (
              <div key={key} className={`p-1 rounded ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                <div className={`font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{val}</div>
                {key.substring(0, 4)}
              </div>
            ))}
          </div>
        )}

        {/* Hall of Fame Actions */}
        {onAddToHallOfFame && !plate.inHallOfFame && score > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToHallOfFame(plate); }}
            className={`w-full mt-4 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
          >
            <i className="fas fa-star text-yellow-400"></i> Add to Hall of Fame
          </button>
        )}
        {plate.inHallOfFame && (
          <div className="w-full mt-4 bg-yellow-50 text-yellow-700 py-2 rounded-lg text-sm font-bold text-center border border-yellow-200">
            <i className="fas fa-check-circle mr-1"></i> In Hall of Fame
          </div>
        )}
      </div>
    </div>
  );
};

export default PlateCard;