import axios from "axios";

export async function login(token: string) {
    try {
        // Make a request to the external API
        const response = await axios.post('https://algotest.in/api/login-google', {
            token: token
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const cookies = response.headers['set-cookie'] || [];
        let csrfAccessToken = '';

        for (const cookie of cookies) {
        if (cookie.startsWith('csrf_access_token=')) {
            csrfAccessToken = cookie.split(';')[0].split('=')[1]; // Extract the value
            if (csrfAccessToken.length > 0) break; // Exit the loop once the token is found
        }
        }
        return csrfAccessToken;
    } catch (error) {
        console.error(error);
    }
}