import '../../App.css'
import LaunchButton from '../components/LaunchButton.tsx'
import {useDataSync} from "../hooks/useDataSync.ts";


function App() {
    const {state, handleSync} = useDataSync();
    return (
        <div>
            <h1>Welcome to My App!</h1>
            <LaunchButton
                onClick={() => handleSync('left')}
                isLoading={state.isLoading}
                label="Left Drum"
            />
            <LaunchButton
                onClick={() => handleSync('right')}
                isLoading={state.isLoading}
                label="Right Drum"
            />
        </div>
    );
}

export default App