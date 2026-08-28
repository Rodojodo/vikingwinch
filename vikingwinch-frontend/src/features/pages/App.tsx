import '../../App.css'
import LaunchButton from '../components/LaunchButton.tsx'
import {useWinchSession} from "../hooks/useWinchSession.ts";


function App() {
    const {isLoading, executeLaunch} = useWinchSession();
    return (
        <div>
            <h1>Welcome to My App!</h1>
        </div>
    );
}

export default App