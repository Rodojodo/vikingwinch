import { PublicClientApplication, type Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
    auth: {
        clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
        redirectUri: "http://localhost:5173", // Vite's default port
    },
    cache: {
        cacheLocation: "sessionStorage",
    }
};

export const msalInstance = new PublicClientApplication(msalConfig);