import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load components to split the bundle
const Game = lazy(() => import('./components/Game'));
const BuffetBingo = lazy(() => import('./components/BuffetBingo'));
const HallOfFame = lazy(() => import('./components/HallOfFame'));

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 text-rose-600 font-bold">
    Loading...
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* If user goes to buffetbingo.com/ -> Show Home */}
          <Route path="/" element={<BuffetBingo />} />
          
          {/* If user goes to buffetbingo.com/play -> Show Game */}
          <Route path="/play" element={<Game />} />

          {/* Hall of Fame */}
          <Route path="/hall-of-fame" element={<HallOfFame />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;