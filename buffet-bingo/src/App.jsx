import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Game from './components/Game';
import BuffetBingo from './components/BuffetBingo';
import HallOfFame from './components/HallOfFame';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* If user goes to buffetbingo.com/ -> Show Home */}
        <Route path="/" element={<BuffetBingo />} />
        
        {/* If user goes to buffetbingo.com/play -> Show Game */}
        <Route path="/play" element={<Game />} />

        {/* Hall of Fame */}
        <Route path="/hall-of-fame" element={<HallOfFame />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;