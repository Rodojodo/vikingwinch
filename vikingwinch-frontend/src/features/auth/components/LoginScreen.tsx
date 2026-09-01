import { useState, useEffect } from "react";
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { getUserDepartment } from "../api/graphAPI.ts";


function LoginScreen() {
    const { instance, accounts, inProgress } = useMsal();
    const [departmentData, setDepartmentData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Automatically trigger whenever the user logs in
    useEffect(() => {
        const fetchUserData = async () => {
            if (accounts.length > 0) {
                setLoading(true);
                try {
                    const tokenResponse = await instance.acquireTokenSilent({
                        scopes: ["User.Read"],
                        account: accounts[0]
                    });

                    const data = await getUserDepartment(tokenResponse.accessToken);
                    setDepartmentData(data);
                } catch (error) {
                    console.error("Failed to load user department:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        if (inProgress === "none") {
            fetchUserData();
        }
    }, [accounts, inProgress, instance]);


    const handleLogin = async () => {
        instance.loginRedirect({ scopes: ["User.Read"] }).catch(console.error);
    };

    const handleLogout = () => {
        instance.logoutRedirect().catch(console.error);
    };


    return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
            <h1>My Entra ID App</h1>

            <AuthenticatedTemplate>
                <p>Welcome, {accounts[0]?.name}!</p>

                {loading ? (
                    <p>Loading profile details...</p>
                ) : (
                    <p><strong>Department:</strong> {departmentData?.department || "No department assigned"}</p>
                )}

                <button onClick={handleLogout}>Log Out</button>
            </AuthenticatedTemplate>

            <UnauthenticatedTemplate>
                <p>Please log in to see your profile.</p>
                <button onClick={handleLogin}>Log In with Microsoft</button>
            </UnauthenticatedTemplate>
        </div>
    );
}


export default LoginScreen;