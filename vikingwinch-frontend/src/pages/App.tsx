import { useState } from 'react';
import '../App.css'
import { WinchOpsPage } from './WinchOpsPage';

function App() {
    const [operatorSn] = useState('OFF-1001');
    const [squadronId] = useState('123 VGS');

    return (
        <WinchOpsPage squadronId={squadronId} operatorSn={operatorSn} />
    );
}

export default App;