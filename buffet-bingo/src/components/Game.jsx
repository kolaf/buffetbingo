import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { signInAnonymously, onAuthStateChanged, GoogleAuthProvider, linkWithPopup, signInWithPopup, signOut, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import {
  doc, setDoc, getDoc, onSnapshot, collection,
  addDoc, query, orderBy, deleteDoc, where, getDocs, serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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
  const [shortCode, setShortCode] = useState("");
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('buffetBingo_playerName') || "");
  const [joinCode, setJoinCode] = useState("");
  const [hostId, setHostId] = useState(null);
  const [myTables, setMyTables] = useState([]);
  const [copied, setCopied] = useState(false);
  const [pendingJoinId, setPendingJoinId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isTableClosed, setIsTableClosed] = useState(false);
  const redirectCheckRef = useRef(false);

  // 1. Auth
  useEffect(() => {
    // Handle redirect result for mobile login
    const handleRedirect = async () => {
      try {
        await getRedirectResult(auth);
      } catch (error) {
        console.error("Redirect login error:", error);
        if (error.code === 'auth/unauthorized-domain') {
          alert(`Configuration Error: The domain "${window.location.hostname}" is not authorized. Add it to Firebase Console > Authentication > Settings > Authorized Domains.`);
        } else {
          alert("Login failed: " + error.message);
        }
      } finally {
        redirectCheckRef.current = true;
        if (!auth.currentUser) {
          signInAnonymously(auth);
        }
      }
    };
    handleRedirect();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        if (redirectCheckRef.current) {
          signInAnonymously(auth);
        }
      } else {
        // If logged in via provider but name is missing, force reload to fetch profile
        if (!u.isAnonymous && !u.displayName) {
          await u.reload();
          u = auth.currentUser;
        }
        setUser(u);
        if (u?.displayName) {
          setPlayerName((prev) => prev || u.displayName);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 1.5 Restore Session
  useEffect(() => {
    // If there is a join link, skip restoration to allow the link to take precedence
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('join')) return;

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

  // 1.5b Handle deep links for joining
  useEffect(() => {
    const handleJoinLink = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const joinId = urlParams.get('join');

      if (joinId) {
        // Force clear any existing session to prioritize the link
        setTableId("");
        localStorage.removeItem('buffetBingo_tableId');
        
        setPendingJoinId(joinId);
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        
        try {
          const tableSnap = await getDoc(doc(db, "tables", joinId));
          if (tableSnap.exists()) {
            setJoinCode(tableSnap.data().shortCode);
          }
        } catch (error) {
          console.error("Error fetching table from join link:", error);
        }
      }
    };
    handleJoinLink();
  }, []); // Run only once on mount

  // 1.6 Persist Player Name
  useEffect(() => {
    localStorage.setItem('buffetBingo_playerName', playerName);
  }, [playerName]);

  // 1.7 Fetch User's Tables
  useEffect(() => {
    if (user && !user.isAnonymous) {
      const q = query(collection(db, "tables"), where("host", "==", user.uid), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setMyTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return unsubscribe;
    } else {
      setMyTables([]);
    }
  }, [user]);

  // Helper to perform the actual join database operations
  const performJoin = async (tId) => {
    const playerRef = doc(db, "tables", tId, "players", user.uid);
    const playerSnap = await getDoc(playerRef);

    let nameToUse = null;
    if (!playerSnap.exists()) {
      nameToUse = playerName || user.displayName || "Guest Ninja";
    } else if (playerName) {
      nameToUse = playerName;
    }

    if (nameToUse) {
      const q = query(collection(db, "tables", tId, "players"), where("name", "==", nameToUse));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.docs.some(d => d.id !== user.uid)) {
        return alert(`The name "${nameToUse}" is already taken. Please choose another.`);
      }
    }

    setTableId(tId);
    localStorage.setItem('buffetBingo_tableId', tId);
    localStorage.setItem('buffetBingo_timestamp', new Date().getTime().toString());

    if (!playerSnap.exists()) {
      await setDoc(playerRef, {
        name: nameToUse, score: 0, photoUrl: null
      });
    } else if (playerName) {
      await setDoc(playerRef, { name: playerName }, { merge: true });
    }
  };

  // 1.8 Auto-Join if Pending ID exists and User has Name
  useEffect(() => {
    if (user && pendingJoinId) {
      // Only auto-join if we have a name ready (returning user or Google user)
      const hasName = user.displayName || (playerName && playerName.trim().length > 0);
      if (hasName) {
        performJoin(pendingJoinId);
        setPendingJoinId(null);
      }
    }
  }, [user, pendingJoinId]); // Intentionally exclude playerName to avoid auto-joining while typing

  // 2. Real-time Players Listener (Sub-collection)
  useEffect(() => {
    if (!tableId) return;

    let isInitialSnapshot = true;

    // Listen to the 'players' sub-collection inside the table
    const playersRef = collection(db, "tables", tableId, "players");
    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      const playerList = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      // Sort by score descending
      playerList.sort((a, b) => parseFloat(b.score || 0) - parseFloat(a.score || 0));
      setPlayers(playerList);

      if (!isInitialSnapshot) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const newPlayer = change.doc.data();
            if (auth.currentUser && change.doc.id !== auth.currentUser.uid) {
              setToastMessage(`${newPlayer.name} joined!`);
              setTimeout(() => setToastMessage(null), 3000);
            }
          }
        });
      }
      isInitialSnapshot = false;
    });

    return unsubscribe;
  }, [tableId]);

  // 2.5 Fetch Host ID
  useEffect(() => {
    if (!tableId) {
      setHostId(null);
      setShortCode("");
      setIsTableClosed(false);
      return;
    }
    const unsub = onSnapshot(doc(db, "tables", tableId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setHostId(data.host);
        setShortCode(data.shortCode);
        setIsTableClosed(data.status === 'closed');
      }
    });
    return unsub;
  }, [tableId]);

  // Actions
  const createTable = async () => {
    if (!user) return alert("Please wait for login to complete.");
    
    // Generate GUID for the table
    const guid = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Generate a unique 4-letter short code
    let code = "";
    let isUnique = false;
    const twoWeeksAgo = new Date(Date.now() - 12096e5);

    for (let i = 0; i < 20; i++) {
      code = Math.random().toString(36).substring(2, 6).toUpperCase();
      // Check if this code is in use by any table created in the last 2 weeks
      const q = query(collection(db, "tables"), where("shortCode", "==", code));
      const snap = await getDocs(q);
      
      let activeCollision = false;
      const cleanupPromises = [];

      snap.forEach((d) => {
        const data = d.data();
        if (data.createdAt?.toDate && data.createdAt.toDate() > twoWeeksAgo) {
          activeCollision = true;
        } else {
          // Table is outside validity window. Remove short code.
          cleanupPromises.push(setDoc(d.ref, { shortCode: null }, { merge: true }));
        }
      });

      await Promise.all(cleanupPromises);

      if (!activeCollision) {
        isUnique = true;
        break;
      }
    }

    if (!isUnique) return alert("Could not generate a unique room code. Please try again.");

    try {
      console.log("Creating table with GUID:", guid, "Code:", code);
      await setDoc(doc(db, "tables", guid), { 
        host: user.uid, 
        createdAt: serverTimestamp(),
        shortCode: code
      });

      // Add self to sub-collection
      await setDoc(doc(db, "tables", guid, "players", user.uid), {
        name: user.displayName || playerName || "Host (You)", score: 0, photoUrl: null
      });
      setTableId(guid);
      localStorage.setItem('buffetBingo_tableId', guid);
      localStorage.setItem('buffetBingo_timestamp', new Date().getTime().toString());
    } catch (error) {
      console.error("Error creating table:", error);
    }
  };

  const joinTable = async (e) => {
    e.preventDefault();
    
    if (pendingJoinId) {
      await performJoin(pendingJoinId);
      setPendingJoinId(null);
      return;
    }

    if (!joinCode) return;
    const code = joinCode.toUpperCase();
    
    // Find table by shortCode, prioritizing recent ones
    const twoWeeksAgo = new Date(Date.now() - 12096e5);
    const q = query(collection(db, "tables"), where("shortCode", "==", code));
    const snap = await getDocs(q);

    // Filter for active tables (created < 2 weeks ago)
    const activeTables = snap.docs.filter(d => {
      const data = d.data();
      return data.createdAt?.toDate() > twoWeeksAgo;
    });

    // Sort by creation date descending (newest first)
    activeTables.sort((a, b) => b.data().createdAt?.toMillis() - a.data().createdAt?.toMillis());

    if (activeTables.length > 0) {
      const targetTable = activeTables[0];
      const targetId = targetTable.id;

      await performJoin(targetId);
    } else {
      alert("Table not found");
    }
  };

  const leaveTable = async () => {
    if (window.confirm("Are you sure you want to leave this table?")) {
      if (tableId && user) {
        try {
          await deleteDoc(doc(db, "tables", tableId, "players", user.uid));
        } catch (error) {
          console.error("Error removing player:", error);
        }
      }
      setTableId("");
      setPlayers([]);
      setIsScoring(false);
      localStorage.removeItem('buffetBingo_tableId');
      localStorage.removeItem('buffetBingo_timestamp');
    }
  };

  const addToHallOfFame = async (playerData) => {
    if (!user) return;
    
    let currentUser = auth.currentUser || user;

    // Enforce authentication for Hall of Fame
    if (currentUser.isAnonymous) {
      if (!window.confirm("To join the Hall of Fame, you must link a Google account to verify you are a real Ninja. Proceed?")) {
        return;
      }
      
      const provider = new GoogleAuthProvider();
      try {
        const result = await linkWithPopup(currentUser, provider);
        currentUser = result.user;
        setUser(currentUser);
      } catch (error) {
        console.error("Auth Error:", error);
        alert("Authentication failed or cancelled. Could not join Hall of Fame.");
        return;
      }
    }

    // Force reload to ensure we have the latest display name from the provider
    await currentUser.reload();

    try {
      await addDoc(collection(db, "hallOfFame"), {
        ...playerData,
        name: currentUser.displayName || playerData.name,
        hallOfFameJoinedAt: new Date(),
        userId: currentUser.uid,
        originTableId: tableId
      });
      await setDoc(doc(db, "tables", tableId, "players", currentUser.uid), { inHallOfFame: true }, { merge: true });
      alert("You have been immortalized in the Hall of Fame!");
    } catch (error) {
      console.error("Error adding to Hall of Fame:", error);
      alert("Something went wrong adding you to the Hall of Fame.");
    }
  };

  const handleShare = () => {
    const shareLink = `${window.location.origin}/play?join=${tableId}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error("Login failed:", error);
      if (error.code === 'auth/unauthorized-domain') {
        alert(`Configuration Error: The domain "${window.location.hostname}" is not authorized. Add it to Firebase Console > Authentication > Settings > Authorized Domains.`);
      } else {
        alert("Login failed: " + error.message);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const closeTable = async () => {
    if (!window.confirm("Are you sure you want to close the table? No more plates can be submitted.")) return;
    try {
      await setDoc(doc(db, "tables", tableId), { status: 'closed' }, { merge: true });
    } catch (error) {
      console.error("Error closing table:", error);
    }
  };

  const deleteFullTable = async (tId, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this table and all its plates? This cannot be undone.")) return;
    
    try {
      const playersSnap = await getDocs(collection(db, "tables", tId, "players"));
      const promises = playersSnap.docs.map(async (p) => {
        try { await deleteObject(ref(storage, `plates/${tId}/${p.id}.jpg`)); } catch(err) {}
        return deleteDoc(p.ref);
      });
      await Promise.all(promises);
      await deleteDoc(doc(db, "tables", tId));
      setMyTables(prev => prev.filter(t => t.id !== tId));
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to delete table");
    }
  };

  const deletePlate = async (targetUserId) => {
    if (!user || !tableId) return;
    if (!window.confirm("Are you sure you want to delete this plate? This cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "tables", tableId, "players", targetUserId));
      
      // Attempt to delete the photo from storage
      const storageRef = ref(storage, `plates/${tableId}/${targetUserId}.jpg`);
      try {
        await deleteObject(storageRef);
      } catch (e) {
        console.log("Storage delete error (ignore):", e);
      }
    } catch (error) {
      console.error("Error deleting plate:", error);
      alert("Failed to delete plate.");
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
                            Table: {shortCode || tableId}
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
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center relative">
                        <div className="absolute top-4 right-4">
                            {user?.isAnonymous ? (
                                <button onClick={handleLogin} className="text-xs font-bold text-rose-600 hover:text-rose-700">
                                    <i className="fas fa-sign-in-alt mr-1"></i> Login
                                </button>
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
                                        <div key={t.id} onClick={() => { setTableId(t.id); localStorage.setItem('buffetBingo_tableId', t.id); localStorage.setItem('buffetBingo_timestamp', new Date().getTime().toString()); }} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-rose-50 cursor-pointer transition group">
                                            <div className="text-left">
                                                <div className="font-mono font-bold text-slate-700">{t.shortCode || t.id}</div>
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
                                        {p.submittedAt?.seconds ? new Date(p.submittedAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-900 truncate pr-2">{p.name}</h3>
                                        <div className={`text-2xl .-bold ${parseFloat(p.score) >= 8 ? 'text-emerald-500' : parseFloat(p.score) >= 5 ? 'text-amber-500' : 'text-rose-500'}`}>
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
                        )})}
                    </div>
                    
                    {players.filter(p => p.photoUrl).length === 0 && (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                            <div className="text-slate-300 text-6xl mb-4"><i className="fas fa-utensils"></i></div>
                            <p className="text-slate-500 font-medium">No plates submitted yet.</p>
                            <p className="text-slate-400 text-sm">Be the first to upload!</p>
                        </div>
                    )}
                </div>
            )}
        </div>

        {toastMessage && (
            <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 transition-all">
                <div className="bg-emerald-500 w-8 h-8 rounded-full flex items-center justify-center">
                    <i className="fas fa-user-plus text-sm"></i>
                </div>
                <span className="font-bold">{toastMessage}</span>
            </div>
        )}
    </div>
  );
}

export default Game;