import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { BADGES } from '../constants/badges';
import PlateCard from './PlateCard';

const HallOfFame = () => {
  const [plates, setPlates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchPlates = async () => {
      try {
        const q = query(
          collection(db, "hallOfFame"),
          orderBy("score", "desc"),
          limit(20)
        );
        const querySnapshot = await getDocs(q);
        const fetchedPlates = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPlates(fetchedPlates);
      } catch (error) {
        console.error("Error fetching Hall of Fame:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlates();
  }, []);

  const handleDelete = async (plateId) => {
    if (window.confirm("Are you sure you want to remove this plate from the Hall of Fame?")) {
      try {
        const plate = plates.find(p => p.id === plateId);
        await deleteDoc(doc(db, "hallOfFame", plateId));

        // If we have origin info, update the source table to remove the "In Hall of Fame" status
        if (plate?.originTableId && plate?.userId) {
          try {
            await updateDoc(doc(db, "tables", plate.originTableId, "players", plate.userId), {
              inHallOfFame: false
            });
          } catch (err) {
            console.log("Could not update original table (it may be closed):", err);
          }
        }

        setPlates(prev => prev.filter(p => p.id !== plateId));
      } catch (error) {
        console.error("Error deleting plate:", error);
        alert("Failed to delete plate.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      {/* Navbar */}
      <nav className="bg-slate-800 border-b border-slate-700 px-4 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center hover:opacity-80 transition">
            <i className="fas fa-utensils text-rose-500 text-xl mr-2"></i>
            <span className="text-xl font-bold text-white" style={{ fontFamily: "'Fredoka', sans-serif" }}>Buffet Bingo</span>
          </Link>
          <Link to="/play" className="bg-rose-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-rose-700 transition">
            Grab a plate
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400" style={{ fontFamily: "'Fredoka', sans-serif" }}>
            Hall of Fame
          </h1>
          <p className="text-slate-400 text-lg">The greatest plates in buffet bingo history.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <i className="fas fa-circle-notch fa-spin text-4xl text-rose-500"></i>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {plates.map((plate, index) => (
              <PlateCard 
                key={plate.id} 
                plate={plate} 
                rank={index + 1} 
                theme="dark"
                onDelete={user && user.uid === plate.userId ? handleDelete : null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HallOfFame;
