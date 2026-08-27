import './App.css'
import LaunchButton from './features/components/LaunchButton'
import React, { useState } from 'react';


function App() {
  return (
    <div>
      <h1>Welcome to My App!</h1>
        <LaunchButton state isLeft/>
        <LaunchButton state isLeft={false}/>
    </div>
  );
}

export default App