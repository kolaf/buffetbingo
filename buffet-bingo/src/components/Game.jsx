import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  doc, setDoc, getDoc, onSnapshot, collection,
  addDoc, query, orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BADGES } from '../constants/badges';

// --- COMPONENT: Score Entry Form ---
const ScoreForm = ({ tableId, user, onComplete, currentName }) => {
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [scores, setScores] = useState({
    taste: 5,
    cohesion: 5,
    regret: 1,
    waste: 1
  });
  const [selectedBadges, setSelectedBadges] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 300;
          canvas.height = 300;
          const ratio = Math.max(300 / img.width, 300 / img.height);
          const centerShift_x = (300 - img.width * ratio) / 2;
          const centerShift_y = (300 - img.height * ratio) / 2;
          ctx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
          canvas.toBlob((blob) => {
            setPhoto(blob);
            setPhotoPreview(URL.createObjectURL(blob));
          }, 'image/jpeg', 0.85);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleBadge = (badgeName) => {
    if (selectedBadges.includes(badgeName)) {
      setSelectedBadges(selectedBadges.filter(b => b !== badgeName));
    } else {
      setSelectedBadges([...selectedBadges, badgeName]);
    }
  };

  const submitScore = async () => {
    if (!photo) return alert("You must upload a plate photo!");
    setLoading(true);

    try {
      const finalScore = (
        parseInt(scores.taste) +
        parseInt(scores.cohesion) +
        (11 - parseInt(scores.regret)) +
        (11 - parseInt(scores.waste))
      ) / 4;

      const storageRef = ref(storage, `plates/${tableId}/${user.uid}.jpg`);
      await uploadBytes(storageRef, photo);
      const photoUrl = await getDownloadURL(storageRef);

      await setDoc(doc(db, "tables", tableId, "players", user.uid), {
        name: currentName || user.displayName || "Ninja Guest",
        score: finalScore.toFixed(1),
        photoUrl: photoUrl,
        breakdown: scores,
        badges: selectedBadges,
        submittedAt: new Date()
      });

      onComplete();
    } catch (error) {
      console.error("Error uploading:", error);
      alert("Upload failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-rose-600">
      <i className="fas fa-circle-notch fa-spin text-4xl mb-4"></i>
      <p className="text-xl font-bold">Uploading Evidence...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button onClick={onComplete} className="mb-6 text-slate-500 hover:text-slate-800 flex items-center transition">
        <i className="fas fa-arrow-left mr-2"></i> Back to Table
      </button>
      
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
          <i className="fas fa-camera text-rose-600 mr-3"></i>
          Rate Your Plate
        </h3>

        {/* Photo Input */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-2">1. Evidence (Photo)</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="hidden" 
            id="plate-photo"
          />
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            onChange={handleFileChange} 
            className="hidden" 
            id="plate-camera"
          />

          {photoPreview ? (
            <div className="relative w-full h-48 border-2 border-dashed border-rose-500 bg-rose-50 rounded-xl flex items-center justify-center overflow-hidden">
              <img src={photoPreview} alt="Preview" className="h-full w-full object-contain" />
              <button 
                onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                className="absolute top-2 right-2 bg-white text-rose-600 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-rose-50 transition"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ) : (
            <div className="flex gap-3 h-48">
              <label htmlFor="plate-camera" className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-rose-400 hover:bg-slate-50 transition-colors">
                <i className="fas fa-camera text-3xl text-rose-500 mb-2"></i>
                <span className="text-sm font-bold text-slate-600">Camera</span>
              </label>
              <label htmlFor="plate-photo" className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-rose-400 hover:bg-slate-50 transition-colors">
                <i className="fas fa-cloud-upload-alt text-3xl text-slate-400 mb-2"></i>
                <span className="text-sm font-bold text-slate-600">Upload</span>
              </label>
            </div>
          )}
        </div>

        {/* Sliders */}
        <div className="space-y-6 mb-8">
          {[
            { id: 'taste', label: 'Taste', minLabel: 'Inedible', maxLabel: 'Delicious' },
            { id: 'cohesion', label: 'Cohesion', minLabel: 'Chaos', maxLabel: 'Perfect' },
            { id: 'regret', label: 'Regret', minLabel: 'No Regrets', maxLabel: 'Deep Shame' },
            { id: 'waste', label: 'Waste', minLabel: 'Clean Plate', maxLabel: 'Full Plate' }
          ].map((metric) => (
            <div key={metric.id}>
              <div className="flex justify-between items-end mb-2">
                <label className="text-sm font-bold text-slate-700 capitalize">{metric.label}</label>
                <span className="text-2xl font-bold text-rose-600">{scores[metric.id]}</span>
              </div>
              <input
                type="range" min="1" max="10"
                value={scores[metric.id]}
                onChange={(e) => setScores({ ...scores, [metric.id]: e.target.value })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>{metric.minLabel}</span>
                <span>{metric.maxLabel}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Badges Selection */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-4">Achievements (Optional)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BADGES.map((badge) => {
              const isSelected = selectedBadges.includes(badge.name);
              return (
                <div 
                  key={badge.name}
                  onClick={() => toggleBadge(badge.name)}
                  className={`cursor-pointer p-3 rounded-xl border transition-all flex flex-col items-center text-center ${isSelected ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200' : 'border-slate-200 hover:border-rose-300 hover:bg-slate-50'}`}
                >
                  <i className={`${badge.icon} text-xl mb-2 ${isSelected ? 'text-rose-600' : 'text-slate-400'}`}></i>
                  <span className={`text-xs font-bold ${isSelected ? 'text-rose-700' : 'text-slate-600'}`}>{badge.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={submitScore}
          className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold hover:bg-rose-700 transition shadow-lg transform hover:-translate-y-0.5"
        >
          Submit Score
        </button>
      </div>
    </div>
  );
};

// --- MAIN APP ---
function Game() {
  const [user, setUser] = useState(null);
  const [tableId, setTableId] = useState("");
  const [players, setPlayers] = useState([]);
  const [isScoring, setIsScoring] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  // 1. Auth
  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (!u) signInAnonymously(auth);
      else setUser(u);
    });
  }, []);

  // 1.5 Restore Session
  useEffect(() => {
    const storedTableId = localStorage.getItem('buffetBingo_tableId');
    const storedTimestamp = localStorage.getItem('buffetBingo_timestamp');

    if (storedTableId && storedTimestamp) {
      const now = new Date().getTime();
      const joinedAt = parseInt(storedTimestamp, 10);
      const fourHours = 4 * 60 * 60 * 1000;

      if (now - joinedAt < fourHours) {
        setTableId(storedTableId);
      } else {
        localStorage.removeItem('buffetBingo_tableId');
        localStorage.removeItem('buffetBingo_timestamp');
      }
    }
  }, []);

  // 2. Real-time Players Listener (Sub-collection)
  useEffect(() => {
    if (!tableId) return;

    // Listen to the 'players' sub-collection inside the table
    const playersRef = collection(db, "tables", tableId, "players");
    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      const playerList = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })).filter(p => p.photoUrl);
      // Sort by score descending
      playerList.sort((a, b) => parseFloat(b.score || 0) - parseFloat(a.score || 0));
      setPlayers(playerList);
    });

    return unsubscribe;
  }, [tableId]);

  // Actions
  const createTable = async () => {
    if (!user) return alert("Please wait for login to complete.");
    console.log("User is authenticated:", user.uid);
    
    // if (user) {
    //   console.log("User is authenticated:", user.uid);
    //   const docRef = doc(db, "myCollection", "myDocument");
    //   setDoc(docRef, { data: "test" })
    //     .then(() => console.log("Document successfully written!"))
    //     .catch((error) => console.error("Error writing document:", error));
    // } else {
    //   // User is signed out. Attempt anonymous sign-in.
    //   console.log("User is not authenticated. Signing in anonymously...");
    //   signInAnonymously(auth)
    //     .then(() => console.log("Anonymous sign-in successful."))
    //     .catch((error) => console.error("Error signing in anonymously:", error));
    // }
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();

    try {
      console.log("Creating table with code:", code);
      await setDoc(doc(db, "tables", code), { host: user.uid, createdAt: new Date() });

      // Add self to sub-collection
      console.log("Adding self to sub-collection");
      await setDoc(doc(db, "tables", code, "players", user.uid), {
        name: user.displayName || playerName || "Host (You)", score: 0, photoUrl: null
      });
      setTableId(code);
      localStorage.setItem('buffetBingo_tableId', code);
      localStorage.setItem('buffetBingo_timestamp', new Date().getTime().toString());
    } catch (error) {
      console.error("Error creating table:", error);
    }
  };

  const joinTable = async (e) => {
    e.preventDefault();
    if (!joinCode) return;
    const code = joinCode.toUpperCase();
    const tableSnap = await getDoc(doc(db, "tables", code));
    if (tableSnap.exists()) {
      setTableId(code);
      localStorage.setItem('buffetBingo_tableId', code);
      localStorage.setItem('buffetBingo_timestamp', new Date().getTime().toString());
      const playerRef = doc(db, "tables", code, "players", user.uid);
      const playerSnap = await getDoc(playerRef);

      if (!playerSnap.exists()) {
        await setDoc(playerRef, {
          name: user.displayName || playerName || "Guest Ninja", score: 0, photoUrl: null
        });
      } else if (playerName) {
        await setDoc(playerRef, { name: playerName }, { merge: true });
      }
    } else {
      alert("Table not found");
    }
  };

  const leaveTable = () => {
    if (window.confirm("Are you sure you want to leave this table?")) {
      setTableId("");
      setPlayers([]);
      setIsScoring(false);
      localStorage.removeItem('buffetBingo_tableId');
      localStorage.removeItem('buffetBingo_timestamp');
    }
  };

  // --- RENDERING ---

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans">
        {/* External Dependencies */}
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&family=Roboto:wght@300;400;700&display=swap" rel="stylesheet" />

        {/* Navbar */}
        <nav className="bg-white border-b border-slate-200 px-4 py-4 shadow-sm">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link to="/" className="flex items-center hover:opacity-80 transition">
                    <i className="fas fa-utensils text-rose-600 text-xl mr-2"></i>
                    <span className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Fredoka', sans-serif" }}>Buffet Bingo</span>
                </Link>
                {tableId && (
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-100 px-3 py-1 rounded-full text-sm font-mono font-bold text-slate-600">
                            Table: {tableId}
                        </div>
                        <button onClick={leaveTable} className="text-slate-400 hover:text-rose-600 transition" title="Leave Table">
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                )}
            </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-8">
            {!tableId ? (
                // Login / Join Screen
                <div className="max-w-md mx-auto mt-10">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 text-2xl">
                            <i className="fas fa-dice"></i>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "'Fredoka', sans-serif" }}>Start Playing</h1>
                        <p className="text-slate-500 mb-8">Start a table or join your friends.</p>

                        {!user?.displayName && (
                            <div className="mb-6 text-left">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Your Name</label>
                                <input
                                    placeholder="e.g. Ninja Chef"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-rose-500 outline-none transition"
                                />
                            </div>
                        )}

                        <button 
                            onClick={createTable} 
                            disabled={!user} 
                            className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold hover:bg-rose-700 transition shadow-lg mb-6 flex items-center justify-center"
                        >
                            {user ? <><i className="fas fa-plus-circle mr-2"></i> Create New Table</> : "Connecting..."}
                        </button>

                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-400">OR JOIN EXISTING</span></div>
                        </div>

                        <form onSubmit={joinTable} className="flex gap-2">
                            <input 
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                placeholder="ABCD" 
                                className="flex-1 p-4 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-rose-500 outline-none font-mono text-center uppercase tracking-widest" 
                                maxLength={4}
                            />
                            <button 
                                type="submit"
                                disabled={!user || !joinCode}
                                className="bg-slate-900 text-white px-6 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg"
                            >
                                Join
                            </button>
                        </form>
                    </div>
                </div>
            ) : isScoring ? (
                // Score Form
                <ScoreForm
                    tableId={tableId}
                    user={user}
                    onComplete={() => setIsScoring(false)}
                    currentName={players.find(p => p.uid === user?.uid)?.name || user?.displayName || playerName}
                />
            ) : (
                // Table / Results
                <div>
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Live Scoreboard</h2>
                            <p className="text-slate-500">Waiting for plates...</p>
                        </div>
                        <button 
                            onClick={() => setIsScoring(true)} 
                            className="bg-rose-600 text-white px-6 py-3 rounded-full font-bold hover:bg-rose-700 transition shadow-lg flex items-center"
                        >
                            <i className="fas fa-camera mr-2"></i> Add Plate
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {players.map((p, index) => {
                            const scoreVal = parseFloat(p.score || 0);
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
                                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                                        {p.submittedAt?.seconds ? new Date(p.submittedAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
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
                                            <div className="bg-slate-50 p-1 rounded">
                                                <div className="font-bold text-slate-700 text-xs">{p.breakdown.taste}</div>
                                                Taste
                                            </div>
                                            <div className="bg-slate-50 p-1 rounded">
                                                <div className="font-bold text-slate-700 text-xs">{p.breakdown.cohesion}</div>
                                                Coh.
                                            </div>
                                            <div className="bg-slate-50 p-1 rounded">
                                                <div className="font-bold text-slate-700 text-xs">{p.breakdown.regret}</div>
                                                Reg.
                                            </div>
                                            <div className="bg-slate-50 p-1 rounded">
                                                <div className="font-bold text-slate-700 text-xs">{p.breakdown.waste}</div>
                                                Wst.
                                            </div>
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
                                </div>
                            </div>
                        )})}
                    </div>
                    
                    {players.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                            <div className="text-slate-300 text-6xl mb-4"><i className="fas fa-utensils"></i></div>
                            <p className="text-slate-500 font-medium">No plates submitted yet.</p>
                            <p className="text-slate-400 text-sm">Be the first to upload!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
}

export default Game;