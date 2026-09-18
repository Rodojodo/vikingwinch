import {useEffect, useState} from 'react';
import {AuthenticatedTemplate, UnauthenticatedTemplate, useMsal} from '@azure/msal-react';
import {Show, useUser, UserButton} from '@clerk/react';
import {Box} from '@mui/material';
import type {SxProps, Theme} from '@mui/material/styles';
import '../App.css';
import {WinchOpsPage} from './WinchOpsPage';
import {LoginPage} from './LoginPage';
import {getUserDepartment, getUserProfile} from '../features/auth/api/graphAPI';
import {OperatorSelectPanel} from '../features/auth';
import {appBackgroundSx} from '../themes/styles';

/**
 * Auth Provider Selection:
 * - 'clerk': Default authentication provider across all environments (development, staging, production).
 * - 'msal': Microsoft Entra ID (MSAL) — preserved intact for future production use when required.
 *
 * Defaults to 'clerk' everywhere (including production), unless VITE_AUTH_PROVIDER is explicitly set to 'msal'.
 * In unit testing mode without Clerk provider, falls back to 'msal' to preserve existing MSAL mock suites.
 */
export const AUTH_PROVIDER =
    import.meta.env.MODE === 'test'
        ? (import.meta.env.VITE_TEST_AUTH_PROVIDER || 'msal')
        : (import.meta.env.VITE_AUTH_PROVIDER || 'clerk');

const OPERATOR_SESSION_KEY = 'vikingwinch_operator_sn';

function ClerkApp() {
    const {user, isLoaded, isSignedIn} = useUser();
    const [selectedOperatorSn, setSelectedOperatorSn] = useState<string | null>(() => {
        try {
            return sessionStorage.getItem(OPERATOR_SESSION_KEY);
        } catch {
            return null;
        }
    });

    const isUserSignedIn = isSignedIn ?? Boolean(user);

    useEffect(() => {
        if (isLoaded && (!isUserSignedIn || !user)) {
            try {
                sessionStorage.removeItem(OPERATOR_SESSION_KEY);
            } catch {
                // ignore storage access errors
            }
            if (selectedOperatorSn !== null) {
                // oxlint-disable-next-line react/set-state-in-effect
                setSelectedOperatorSn(null);
            }
        }
    }, [isLoaded, isUserSignedIn, user, selectedOperatorSn]);

    if (!isLoaded) {
        return (
            <div style={{
                color: 'white',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                Loading profile...
            </div>
        );
    }

    const squadronId = (user?.username as string) || (user?.publicMetadata?.squadronId as string) || '123 VGS';

    const handleSelectOperator = (operatorSn: string) => {
        try {
            sessionStorage.setItem(OPERATOR_SESSION_KEY, operatorSn);
        } catch {
            // ignore storage access errors
        }
        setSelectedOperatorSn(operatorSn);
    };

    return (
        <>
            <Show when="signed-in">
                {selectedOperatorSn ? (
                    <WinchOpsPage squadronId={squadronId} operatorSn={selectedOperatorSn}/>
                ) : (
                    <Box sx={[appBackgroundSx, { minHeight: '100vh', position: 'relative' }] as SxProps<Theme>}>
                        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                            <UserButton/>
                        </Box>
                        <OperatorSelectPanel
                            squadronId={squadronId}
                            onSelectOperator={handleSelectOperator}
                        />
                    </Box>
                )}
            </Show>
            <Show when="signed-out">
                <LoginPage/>
            </Show>
        </>
    );
}

/**
 * MSAL App flow — preserved intact for future production use
 */
function MsalApp() {
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
                    <div style={{
                        color: 'error.main',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        flexDirection: 'column'
                    }}>
                        <p>{error}</p>
                        <button onClick={() => instance.logoutRedirect()} style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            background: 'primary.main',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}>Return to Login
                        </button>
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

function App() {
    return AUTH_PROVIDER === 'clerk' ? <ClerkApp/> : <MsalApp/>;
}

export default App;
