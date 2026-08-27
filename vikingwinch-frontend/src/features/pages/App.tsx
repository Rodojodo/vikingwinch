import '../../App.css'
import LaunchButton from '../components/LaunchButton.tsx'
import {useWinchSession} from "../hooks/useWinchSession.ts";


function App() {
    const {isLoading, executeLaunch} = useWinchSession();
    return (
        <div>
            <h1>Welcome to My App!</h1>
            <LaunchButton
                onClick={() => executeLaunch('left')}
                isLoading={isLoading}
                label="Left Drum"
            />
            <LaunchButton
                onClick={() => executeLaunch('right')}
                isLoading={isLoading}
                label="Right Drum"
            />
        </div>
    );
}

export default App