/**
 * Calls the Graph API to fetch the user's department and display name.
 * We use ?$select to request the non-default 'department' property.
 */
export async function getUserDepartment(accessToken: string) {
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${accessToken}`);

    const options = {
        method: "GET",
        headers: headers
    };

    const response = await fetch("https://graph.microsoft.com/v1.0/me?$select=displayName,department,employeeId", options);

    if (!response.ok) {
        throw new Error("Failed to fetch user department from Graph API");
    }

    return response.json();
}

/**
 * Calls the Graph API to fetch the user's profile from beta endpoint.
 */
export async function getUserProfile(accessToken: string) {
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${accessToken}`);

    const options = {
        method: "GET",
        headers: headers
    };

    const response = await fetch("https://graph.microsoft.com/beta/me/profile", options);

    if (!response.ok) {
        throw new Error("Failed to fetch user profile from Graph API");
    }

    return response.json();
}