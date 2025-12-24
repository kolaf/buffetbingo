import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { signInAnonymously, onAuthStateChanged, GoogleAuthProvider, linkWithPopup, signInWithPopup, signOut } from 'firebase/auth';
import {
  doc, setDoc, getDoc, onSnapshot, collection,
  addDoc, query, orderBy, deleteDoc, where, getDocs, serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAnalytics, logEvent } from "firebase/analytics";

import ScoreForm from './ScoreForm';
import JoinScreen from './JoinScreen';
import Scoreboard from './Scoreboard';

// --- MAIN APP ---
function Game() {
  const [user, setUser] = useState(null);
  const [tableId, setTableId] = useState("");
  const [players, setPlayers] = useState([]);
  const [isScoring, setIsScoring] = useState(false);
  const [shortCode, setShortCode] = useState("");
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('buffetBingo_playerName') || "");
  const [tableName, setTableName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [hostId, setHostId] = useState(null);
  const [myTables, setMyTables] = useState([]);
  const [copied, setCopied] = useState(false);
  const [pendingJoinId, setPendingJoinId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isTableClosed, setIsTableClosed] = useState(false);
  const [currentTableName, setCurrentTableName] = useState("");
  const [migrationData, setMigrationData] = useState(null);
  const [loginConflict, setLoginConflict] = useState(false);

  // 1. Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        if (u.displayName) {
          setPlayerName((prev) => prev || u.displayName);
        }
      } else {
        signInAnonymously(auth);
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
        const now = Date.now();
        const twoWeeks = 12096e5;
        const tables = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(t => {
            const createdAt = t.createdAt?.seconds ? t.createdAt.seconds * 1000 : 0;
            const isRecent = (now - createdAt) < twoWeeks;
            return t.name || (t.shortCode && isRecent);
          });
        setMyTables(tables);
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
      setCurrentTableName("");
      return;
    }
    const unsub = onSnapshot(doc(db, "tables", tableId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setHostId(data.host);
        setShortCode(data.shortCode);
        setIsTableClosed(data.status === 'closed');
        setCurrentTableName(data.name || "");
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
        shortCode: code,
        name: tableName.trim() || null
      });

      // Add self to sub-collection
      await setDoc(doc(db, "tables", guid, "players", user.uid), {
        name: user.displayName || playerName || "Host (You)", score: 0, photoUrl: null
      });
      setTableId(guid);
      localStorage.setItem('buffetBingo_tableId', guid);
      localStorage.setItem('buffetBingo_timestamp', new Date().getTime().toString());
      setTableName("");

      logEvent(getAnalytics(), 'create_table', { table_id: guid });
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
      logEvent(getAnalytics(), 'join_table', { table_id: targetId, method: 'code' });
    } else {
      alert("Table not found");
    }
  };

  const leaveTable = async () => {
    if (window.confirm("Are you sure you want to leave this table?")) {
      // if (tableId && user && !isTableClosed) {
      //   try {
      //     await deleteDoc(doc(db, "tables", tableId, "players", user.uid));
      //   } catch (error) {
      //     console.error("Error removing player:", error);
      //   }
      // }
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
        if (error.code === 'auth/credential-already-in-use') {
          const anonymousUid = currentUser.uid;
          const anonPlayerRef = doc(db, "tables", tableId, "players", anonymousUid);
          const anonPlayerSnap = await getDoc(anonPlayerRef);

          if (!anonPlayerSnap.exists()) {
            alert("Could not find your original plate to migrate. Please log out and log back in from the main screen.");
            return;
          }
          const plateDataToMigrate = anonPlayerSnap.data();

          // Instead of auto-triggering (which gets blocked), set state to show a modal
          setMigrationData({
            anonUid: anonymousUid,
            plateData: plateDataToMigrate,
            originalPlayerData: playerData
          });
          return;
        } else {
          console.error("Auth Error:", error);
          alert("Authentication failed or cancelled. Could not join Hall of Fame.");
          return;
        }
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
      logEvent(getAnalytics(), 'join_hall_of_fame', { table_id: tableId });
      alert("You have been immortalized in the Hall of Fame!");
    } catch (error) {
      console.error("Error adding to Hall of Fame:", error);
      alert("Something went wrong adding you to the Hall of Fame.");
    }
  };

  const continueMigration = async () => {
    if (!migrationData) return;
    
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const persistentUser = result.user;
      setUser(persistentUser);
      
      const { anonUid, plateData, originalPlayerData } = migrationData;
      let updatedPlateData = { ...plateData };

      // Migrate Photo (Storage)
      if (updatedPlateData.photoUrl) {
        try {
          const oldStorageRef = ref(storage, `plates/${tableId}/${anonUid}.jpg`);
          const newStorageRef = ref(storage, `plates/${tableId}/${persistentUser.uid}.jpg`);
          
          const response = await fetch(updatedPlateData.photoUrl);
          const blob = await response.blob();
          
          await uploadBytes(newStorageRef, blob);
          const newPhotoUrl = await getDownloadURL(newStorageRef);
          updatedPlateData.photoUrl = newPhotoUrl;
          
          await deleteObject(oldStorageRef);
        } catch (storageError) {
          console.error("Photo migration error:", storageError);
        }
      }

      const persistentPlayerRef = doc(db, "tables", tableId, "players", persistentUser.uid);
      await setDoc(persistentPlayerRef, updatedPlateData);
      await deleteDoc(doc(db, "tables", tableId, "players", anonUid));

      // Migrate Table Host
      const tableRef = doc(db, "tables", tableId);
      const tableSnap = await getDoc(tableRef);
      if (tableSnap.exists() && tableSnap.data().host === anonUid) {
        await setDoc(tableRef, { host: persistentUser.uid }, { merge: true });
      }

      // Add to Hall of Fame
      await addDoc(collection(db, "hallOfFame"), {
        ...updatedPlateData,
        name: persistentUser.displayName || originalPlayerData.name,
        hallOfFameJoinedAt: new Date(),
        userId: persistentUser.uid,
        originTableId: tableId
      });
      await setDoc(doc(db, "tables", tableId, "players", persistentUser.uid), { inHallOfFame: true }, { merge: true });
      logEvent(getAnalytics(), 'join_hall_of_fame', { table_id: tableId });
      
      setMigrationData(null);
      alert("You have been immortalized in the Hall of Fame!");
    } catch (error) {
      console.error("Migration failed:", error);
      alert("Migration failed: " + error.message);
    }
  };

  const handleShare = () => {
    const shareLink = `${window.location.origin}/play?join=${tableId}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    logEvent(getAnalytics(), 'share_table', { table_id: tableId });
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    const currentUser = auth.currentUser;

    if (currentUser && currentUser.isAnonymous) {
      // Current user is anonymous, try to link the Google account.
      try {
        await linkWithPopup(currentUser, provider);
        // Success! The anonymous account is now a permanent account.
      } catch (error) {
        if (error.code === 'auth/credential-already-in-use') {
          setLoginConflict(true);
        } else {
          console.error("Login/link failed:", error);
          alert("Login failed: " + error.message);
        }
      }
    } else {
      // No user or user is not anonymous, just do a normal sign-in.
      try {
        await signInWithPopup(auth, provider);
      } catch (error) {
        console.error("Login failed:", error);
        alert("Login failed: " + error.message);
      }
    }
  };

  const resolveLoginConflict = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setLoginConflict(false);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed: " + error.message);
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

  const handleSelectTable = (tId) => {
    setTableId(tId);
    localStorage.setItem('buffetBingo_tableId', tId);
    localStorage.setItem('buffetBingo_timestamp', new Date().getTime().toString());
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
                <JoinScreen
                    user={user}
                    playerName={playerName}
                    setPlayerName={setPlayerName}
                    tableName={tableName}
                    setTableName={setTableName}
                    joinCode={joinCode}
                    setJoinCode={setJoinCode}
                    pendingJoinId={pendingJoinId}
                    myTables={myTables}
                    handleLogin={handleLogin}
                    handleLogout={handleLogout}
                    createTable={createTable}
                    joinTable={joinTable}
                    onSelectTable={handleSelectTable}
                    deleteFullTable={deleteFullTable}
                />
            ) : isScoring ? (
                <ScoreForm
                    tableId={tableId}
                    user={user}
                    onComplete={() => setIsScoring(false)}
                    currentName={players.find(p => p.uid === user?.uid)?.name || user?.displayName || playerName}
                />
            ) : (
                <Scoreboard
                    isTableClosed={isTableClosed}
                    user={user}
                    hostId={hostId}
                    players={players}
                    copied={copied}
                    handleShare={handleShare}
                    closeTable={closeTable}
                    setIsScoring={setIsScoring}
                    deletePlate={deletePlate}
                    addToHallOfFame={addToHallOfFame}
                    tableName={currentTableName}
                />
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

        {migrationData && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
                <div className="bg-white p-8 rounded-2xl text-center max-w-sm shadow-2xl">
                    <i className="fas fa-exchange-alt text-4xl text-rose-600 mb-4"></i>
                    <h3 className="text-xl font-bold mb-2">Account Switch Required</h3>
                    <p className="text-gray-600 mb-6 text-sm">
                        This Google account is already in use. Click below to sign in and move your plate to your existing account.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => setMigrationData(null)} className="px-4 py-2 text-slate-500 font-bold hover:text-slate-700">Cancel</button>
                        <button onClick={continueMigration} className="bg-rose-600 text-white px-6 py-2 rounded-full font-bold hover:bg-rose-700 shadow-lg">
                            Sign In & Migrate
                        </button>
                    </div>
                </div>
            </div>
        )}

        {loginConflict && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
                <div className="bg-white p-8 rounded-2xl text-center max-w-sm shadow-2xl">
                    <i className="fas fa-user-lock text-4xl text-rose-600 mb-4"></i>
                    <h3 className="text-xl font-bold mb-2">Account Exists</h3>
                    <p className="text-gray-600 mb-6 text-sm">
                        This Google account is already linked to another user. Sign in with that account instead?
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => setLoginConflict(false)} className="px-4 py-2 text-slate-500 font-bold hover:text-slate-700">Cancel</button>
                        <button onClick={resolveLoginConflict} className="bg-rose-600 text-white px-6 py-2 rounded-full font-bold hover:bg-rose-700 shadow-lg">
                            Yes, Sign In
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}

export default Game;