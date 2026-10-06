import {useEffect, useState} from 'react';
import {AuthenticatedTemplate, UnauthenticatedTemplate, useMsal} from '@azure/msal-react';
import {Show, useAuth, useUser, UserButton} from '@clerk/react';
import {Box, Typography} from '@mui/material';
import type {SxProps, Theme} from '@mui/material/styles';
import '../App.css';
import {WinchOpsPage} from './WinchOpsPage';
import {LoginPage} from './LoginPage';
import {getUserDepartment, getUserProfile} from '../features/auth/api/graphAPI';
import {appBackgroundSx} from '../themes/styles';
import {setApiTokenProvider} from '../core/http/fetchClient';
import {getCurrentOperator} from '../core/http/operatorsClient';

const API_SCOPE = import.meta.env.VITE_API_SCOPE || import.meta.env.VITE_AZURE_API_SCOPE;

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

const CLERK_JWT_TEMPLATE = import.meta.env.VITE_CLERK_JWT_TEMPLATE || 'vikingwinch_api';

function ClerkApp() {
    const {user, isLoaded, isSignedIn} = useUser();
    const {getToken} = useAuth();
    const [currentOperator, setCurrentOperator] = useState<Awaited<ReturnType<typeof getCurrentOperator>> | null>(null);
    const [operatorError, setOperatorError] = useState<string | null>(null);

    const isUserSignedIn = isSignedIn ?? Boolean(user);

    useEffect(() => {
        setApiTokenProvider(async () => getToken({template: CLERK_JWT_TEMPLATE}));
        return () => setApiTokenProvider(null);
    }, [getToken]);

    useEffect(() => {
        if (!isLoaded || !isUserSignedIn || !user) {
            // oxlint-disable-next-line react/set-state-in-effect
            setCurrentOperator(null);
            // oxlint-disable-next-line react/set-state-in-effect
            setOperatorError(null);
            return;
        }

        let isMounted = true;
        // oxlint-disable-next-line react/set-state-in-effect
        setOperatorError(null);
        getCurrentOperator()
            .then((operator) => {
                if (isMounted) setCurrentOperator(operator);
            })
            .catch((error: unknown) => {
                if (isMounted) {
                    console.error('Failed to load authenticated operator:', error);
                    setOperatorError('Your account is not mapped to an operator. Contact an administrator.');
                }
            });
        return () => {
            isMounted = false;
        };
    }, [isLoaded, isUserSignedIn, user]);

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

    return (
        <>
            <Show when="signed-in">
                {currentOperator ? (
                    <WinchOpsPage
                        squadronId={currentOperator.squadron_id}
                        operatorSn={currentOperator.service_no}
                    />
                ) : operatorError ? (
                    <Box sx={[appBackgroundSx, { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }] as SxProps<Theme>}>
                        <Typography color="error">{operatorError}</Typography>
                    </Box>
                ) : (
                    <Box sx={[appBackgroundSx, { minHeight: '100vh', position: 'relative' }] as SxProps<Theme>}>
                        <Box sx={{ position: 'absolute', top: 16, right: 16 }}><UserButton/></Box>
                        <Typography sx={{ m: 'auto' }}>Loading operator profile...</Typography>
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
        setApiTokenProvider(async () => {
            if (accounts.length === 0) {
                return null;
            }
            if (!API_SCOPE) {
                throw new Error('VITE_API_SCOPE is not configured for the MSAL API audience');
            }
            const tokenResponse = await instance.acquireTokenSilent({
                scopes: [API_SCOPE],
                account: accounts[0],
            });
            return tokenResponse.accessToken;
        });
        return () => setApiTokenProvider(null);
    }, [accounts, instance]);

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
