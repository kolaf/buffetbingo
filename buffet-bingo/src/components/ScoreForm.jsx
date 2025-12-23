import React, { useState } from 'react';
import { db, storage } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BADGES } from '../constants/badges';

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

export default ScoreForm;