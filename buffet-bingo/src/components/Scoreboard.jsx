import React from 'react';
import { BADGES } from '../constants/badges';

const Scoreboard = ({
  isTableClosed,
  user,
  hostId,
  players,
  copied,
  handleShare,
  closeTable,
  setIsScoring,
  deletePlate,
  addToHallOfFame,
  tableName
}) => {
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          {tableName && (
            <h1 className="text-3xl font-bold text-rose-600 mb-1" style={{ fontFamily: "'Fredoka', sans-serif" }}>
              {tableName}
            </h1>
          )}
          <h2 className="text-2xl font-bold text-slate-900">Live Scoreboard</h2>
          <p className={`${isTableClosed ? "text-rose-600 font-bold" : "text-slate-500"}`}>
            {isTableClosed ? "Table Closed" : "Waiting for plates..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="bg-slate-200 text-slate-800 px-6 py-3 rounded-full font-bold hover:bg-slate-300 transition shadow-sm flex items-center w-36 justify-center"
          >
            {copied ? (
              <><i className="fas fa-check mr-2"></i> Copied!</>
            ) : (
              <><i className="fas fa-share-alt mr-2"></i> Share</>
            )}
          </button>

          {user && user.uid === hostId && !isTableClosed && (
            <button
              onClick={closeTable}
              className="bg-slate-800 text-white px-6 py-3 rounded-full font-bold hover:bg-slate-900 transition shadow-sm flex items-center"
            >
              <i className="fas fa-lock mr-2"></i> Close
            </button>
          )}

          {!isTableClosed && (
            <button
              onClick={() => setIsScoring(true)}
              className="bg-rose-600 text-white px-6 py-3 rounded-full font-bold hover:bg-rose-700 transition shadow-lg flex items-center"
            >
              <i className="fas fa-camera mr-2"></i> Add Plate
            </button>
          )}
        </div>
      </div>

      {/* Player List */}
      <div className="mb-8 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
          <i className="fas fa-users mr-1"></i> Players ({players.length})
        </span>
        {players.map(p => (
          <div key={p.uid} className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${p.photoUrl ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200'}`}>
            {p.name}
            {p.photoUrl && <i className="fas fa-check-circle text-emerald-500"></i>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {players.filter(p => p.photoUrl).map((p, index) => {
          const scoreVal = parseFloat(p.score || 0);
          const isMe = user && p.uid === user.uid;
          let cardStyle = "border-slate-100 shadow-sm";
          let RankBadge = null;

          if (scoreVal > 0) {
            if (index === 0) {
              cardStyle = "border-yellow-400 ring-4 ring-yellow-50 shadow-xl transform scale-[1.02] z-10";
              RankBadge = (
                <div className="absolute top-0 left-0 bg-yellow-400 text-white px-3 py-1 rounded-br-xl font-bold shadow-sm z-20">
                  <i className="fas fa-trophy mr-1 text-yellow-100"></i> #1
                </div>
              );
            } else if (index === 1) {
              cardStyle = "border-slate-300 ring-2 ring-slate-50 shadow-lg";
              RankBadge = (
                <div className="absolute top-0 left-0 bg-slate-400 text-white px-3 py-1 rounded-br-xl font-bold shadow-sm z-20">
                  <i className="fas fa-medal mr-1 text-slate-200"></i> #2
                </div>
              );
            } else if (index === 2) {
              cardStyle = "border-amber-600 ring-2 ring-amber-50 shadow-lg";
              RankBadge = (
                <div className="absolute top-0 left-0 bg-amber-600 text-white px-3 py-1 rounded-br-xl font-bold shadow-sm z-20">
                  <i className="fas fa-medal mr-1 text-amber-200"></i> #3
                </div>
              );
            }
          }
          return (
            <div key={p.uid} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition relative ${cardStyle}`}>
              {RankBadge}
              <div className="h-56 bg-slate-100 relative group">
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt="plate" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-300">
                    <i className="fas fa-image text-4xl"></i>
                  </div>
                )}
                {(isMe || (user && user.uid === hostId)) && (
                  <button
                    onClick={() => deletePlate(p.uid)}
                    className="absolute bottom-2 left-2 bg-white/90 text-rose-600 w-8 h-8 rounded-full flex items-center justify-center shadow-sm hover:bg-rose-600 hover:text-white transition z-20"
                    title="Delete Plate"
                  >
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                )}
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                  {p.submittedAt?.seconds ? new Date(p.submittedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900 truncate pr-2">{p.name}</h3>
                  <div className={`text-2xl font-bold ${parseFloat(p.score) >= 8 ? 'text-emerald-500' : parseFloat(p.score) >= 5 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {p.score || 0}
                  </div>
                </div>

                {p.breakdown && (
                  <div className="grid grid-cols-4 gap-1 mt-4 text-center text-[10px] text-slate-500 uppercase tracking-wider">
                    <div className="bg-slate-50 p-1 rounded"><div className="font-bold text-slate-700 text-xs">{p.breakdown.taste}</div>Taste</div>
                    <div className="bg-slate-50 p-1 rounded"><div className="font-bold text-slate-700 text-xs">{p.breakdown.cohesion}</div>Coh.</div>
                    <div className="bg-slate-50 p-1 rounded"><div className="font-bold text-slate-700 text-xs">{p.breakdown.regret}</div>Reg.</div>
                    <div className="bg-slate-50 p-1 rounded"><div className="font-bold text-slate-700 text-xs">{p.breakdown.waste}</div>Wst.</div>
                  </div>
                )}

                {p.badges && p.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-slate-100 justify-center">
                    {p.badges.map((badgeName) => {
                      const badge = BADGES.find(b => b.name === badgeName);
                      if (!badge) return null;
                      return (
                        <span key={badgeName} title={badgeName} className={`text-xs px-2 py-1 rounded-full bg-slate-50 border border-slate-100 ${badge.color}`}><i className={badge.icon}></i></span>
                      );
                    })}
                  </div>
                )}

                {isMe && !p.inHallOfFame && parseFloat(p.score) > 0 && (
                  <button
                    onClick={() => addToHallOfFame(p)}
                    className="w-full mt-4 bg-slate-900 text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-star text-yellow-400"></i> Add to Hall of Fame
                  </button>
                )}
                {p.inHallOfFame && (
                  <div className="w-full mt-4 bg-yellow-50 text-yellow-700 py-2 rounded-lg text-sm font-bold text-center border border-yellow-200">
                    <i className="fas fa-check-circle mr-1"></i> In Hall of Fame
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default Scoreboard;