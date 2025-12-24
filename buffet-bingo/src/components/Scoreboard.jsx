import React from 'react';
import { BADGES } from '../constants/badges';
import PlateCard from './PlateCard';

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
          const isMe = user && p.uid === user.uid;
          const canDelete = isMe || (user && user.uid === hostId);
          const canAddToHoF = isMe;

          return (
            <PlateCard 
              key={p.uid}
              plate={p}
              rank={index + 1}
              theme="light"
              showBreakdown={true}
              onDelete={canDelete ? deletePlate : null}
              onAddToHallOfFame={canAddToHoF ? addToHallOfFame : null}
            />
          )
        })}
      </div>
    </div>
  );
};

export default Scoreboard;