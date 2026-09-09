import { useState, useEffect } from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import '../App.css'
import { WinchOpsPage } from './WinchOpsPage';
import { LoginPage } from './LoginPage';
import { getUserDepartment, getUserProfile } from '../features/auth/api/graphAPI';

function App() {
    const { instance, accounts, inProgress } = useMsal();
    const [operatorSn, setOperatorSn] = useState<string | null>(null);
    const [squadronId, setSquadronId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (accounts.length > 0 && !operatorSn && !squadronId && !error) {
                try {
                    const tokenResponse = await instance.acquireTokenSilent({
                        scopes: ["User.Read"],
                        account: accounts[0]
                    });

                    const graphData = await getUserDepartment(tokenResponse.accessToken);
                    console.log("Graph API User Data Response:", graphData);

                    let employeeId = graphData.employeeId || null;

                    if (!employeeId) {
                        let profileData = null;
                        try {
                            profileData = await getUserProfile(tokenResponse.accessToken);
                            console.log("Graph API User Profile Response:", profileData);
                        } catch (profileErr) {
                            console.warn("Failed to fetch user profile (e.g., 404 Not Found), falling back to v1.0 data:", profileErr);
                        }
                        
                        if (profileData?.positions && Array.isArray(profileData.positions)) {
                            for (const pos of profileData.positions) {
                                if (pos.detail?.employeeId) {
                                    employeeId = pos.detail.employeeId;
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Fallback for testing: check graphData.employeeId from the v1.0/me endpoint
                    setOperatorSn(employeeId || graphData.displayName || 'Unknown Operator');
                    setSquadronId(graphData.department || 'Unknown Squadron');
                } catch (err) {
                    console.error("Failed to load user profile:", err);
                    setError("Failed to load user profile.");
                }
            }
        };

        if (inProgress === "none") {
            fetchUserData();
        }
    }, [accounts, inProgress, instance, operatorSn, squadronId, error]);

    return (
        <>
            <AuthenticatedTemplate>
                {/* Ensure we only render WinchOpsPage once we have the details from Graph */}
                {error ? (
                    <div style={{ color: '#ef4444', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                        <p>{error}</p>
                        <button onClick={() => instance.logoutRedirect()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Return to Login</button>
                    </div>
                ) : operatorSn && squadronId ? (
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