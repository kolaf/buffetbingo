import React from 'react';

const JoinScreen = ({
  user,
  playerName,
  setPlayerName,
  tableName,
  setTableName,
  joinCode,
  setJoinCode,
  pendingJoinId,
  myTables,
  handleLogin,
  handleLogout,
  createTable,
  joinTable,
  onSelectTable,
  deleteFullTable
}) => {
  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center relative">
        <div className="absolute top-4 right-4">
          {user?.isAnonymous ? (
            <div className="flex flex-col items-end">
              <button onClick={handleLogin} className="text-xs font-bold text-rose-600 hover:text-rose-700">
                <i className="fas fa-sign-in-alt mr-1"></i> Login
              </button>
              <span className="text-[10px] text-slate-400 mt-1 max-w-[140px] text-right leading-tight">
                Login optional. Saves tables beyond this session.
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-700 mb-1">{user?.email}</span>
              <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                Logout
              </button>
            </div>
          )}
        </div>
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 text-2xl">
          <i className="fas fa-dice"></i>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "'Fredoka', sans-serif" }}>Start Playing</h1>
        <p className="text-slate-500 mb-8">Start a table or join your friends.</p>

        {pendingJoinId && (
          <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-lg mb-6 text-sm font-bold animate-pulse">
            <i className="fas fa-link mr-2"></i> Joining Table...
          </div>
        )}

        {!user?.displayName && (
          <div className="mb-6 text-left">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Your Name <span className="text-rose-500">*</span></label>
            <input
              placeholder="e.g. Ninja Chef"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-rose-500 outline-none transition"
            />
          </div>
        )}

        <form onSubmit={joinTable} className="flex gap-2 mb-6">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="ABCD"
            className="flex-1 p-4 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-rose-500 outline-none font-mono text-center uppercase tracking-widest"
            maxLength={4}
          />
          <button
            type="submit"
            disabled={!user || !joinCode || !playerName.trim()}
            className="bg-slate-900 text-white px-6 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg disabled:opacity-50"
          >
            Join
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-400">OR CREATE NEW</span></div>
        </div>

        <div className="mb-4 text-left">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Table Name <span className="text-slate-300 font-normal">(Optional)</span></label>
          <input
            placeholder="e.g. Sunday Brunch"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-rose-500 outline-none transition"
          />
        </div>

        <button
          onClick={createTable}
          disabled={!user || !playerName.trim()}
          className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold hover:bg-rose-700 transition shadow-lg flex items-center justify-center disabled:opacity-50"
        >
          {user ? <><i className="fas fa-plus-circle mr-2"></i> Create New Table</> : "Connecting..."}
        </button>

        {myTables.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Your Tables</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {myTables.map(t => (
                <div key={t.id} onClick={() => onSelectTable(t.id)} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-rose-50 cursor-pointer transition group">
                  <div className="text-left">
                    <div className="font-mono font-bold text-slate-700">{t.name || t.shortCode || t.id}</div>
                    <div className="text-xs text-slate-400">{t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown date'}</div>
                  </div>
                  <button
                    onClick={(e) => deleteFullTable(t.id, e)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:bg-rose-100 hover:text-rose-600 transition"
                  >
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinScreen;