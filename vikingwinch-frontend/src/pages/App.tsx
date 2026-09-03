import { useState, useEffect } from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import '../App.css'
import { WinchOpsPage } from './WinchOpsPage';
import { LoginPage } from './LoginPage';
import { getUserDepartment } from '../features/auth/api/graphAPI';

function App() {
    const { instance, accounts, inProgress } = useMsal();
    const [operatorSn, setOperatorSn] = useState<string | null>(null);
    const [squadronId, setSquadronId] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (accounts.length > 0 && !operatorSn && !squadronId) {
                try {
                    const tokenResponse = await instance.acquireTokenSilent({
                        scopes: ["User.Read"],
                        account: accounts[0]
                    });

                    const graphData = await getUserDepartment(tokenResponse.accessToken);
                    console.log("Graph API User Data Response:", graphData);
                    
                    setOperatorSn(graphData.displayName || 'Unknown Operator');
                    setSquadronId(graphData.department || 'Unknown Squadron');
                } catch (error) {
                    console.error("Failed to load user profile:", error);
                }
            }
        };

        if (inProgress === "none") {
            fetchUserData();
        }
    }, [accounts, inProgress, instance, operatorSn, squadronId]);

    return (
        <>
            <AuthenticatedTemplate>
                {/* Ensure we only render WinchOpsPage once we have the details from Graph */}
                {operatorSn && squadronId ? (
                    <WinchOpsPage squadronId={squadronId} operatorSn={operatorSn} />
                ) : (
                    <div style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                        Loading profile...
                    </div>
                )}
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <LoginPage />
            </UnauthenticatedTemplate>
        </>
    );
}

export default App;