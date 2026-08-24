import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";

function App() {
    const { instance, accounts } = useMsal();

    const handleLogin = () => {
        // Changed to Redirect!
        instance.loginRedirect({ scopes: ["User.Read"] }).catch(console.error);
    };

    const handleLogout = () => {
        // Changed to Redirect!
        instance.logoutRedirect().catch(console.error);
    };

    return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
            <h1>My Entra ID App</h1>

            <AuthenticatedTemplate>
                <p>Welcome, {accounts[0]?.name}!</p>
                <button onClick={handleLogout}>Log Out</button>
            </AuthenticatedTemplate>

            <UnauthenticatedTemplate>
                <p>Please log in to see your profile.</p>
                <button onClick={handleLogin}>Log In with Microsoft</button>
            </UnauthenticatedTemplate>
        </div>
    );
}

export default App;