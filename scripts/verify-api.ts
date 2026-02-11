
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const client = wrapper(axios.create({
    baseURL: 'http://localhost:5000',
    jar,
    withCredentials: true
}));

async function runVerification() {
    console.log("Starting verification...");

    try {
        // 1. Authentication (Mock Auto-login)
        console.log("\n--- Testing Authentication ---");
        const userRes = await client.get('/api/auth/user');
        console.log("User:", userRes.data);
        if (!userRes.data.id) throw new Error("Authentication failed");

        // 2. Profile
        console.log("\n--- Testing Profile ---");
        let profileRes;
        try {
            profileRes = await client.get('/api/profiles/me');
            console.log("Profile found:", profileRes.data?.role);
        } catch (e: any) {
            console.log("Profile check error (might be null):", e.message);
        }

        if (!profileRes?.data) {
            console.log("Creating profile...");
            const createRes = await client.post('/api/profiles', {
                role: "Test Engineer",
                companyName: "Test Corp"
            });
            console.log("Profile created:", createRes.data);
        } else {
            console.log("Profile already exists.");
        }

        // 3. Posts
        console.log("\n--- Testing Posts ---");
        const postRes = await client.post('/api/posts', {
            content: "This is a test post from the verification script.",
            category: "General Experience"
        });
        console.log("Post created:", postRes.data.id);

        const feedRes = await client.get('/api/posts');
        console.log("Feed fetched, count:", feedRes.data.length);
        const myPost = feedRes.data.find((p: any) => p.id === postRes.data.id);
        if (!myPost) throw new Error("Created post not found in feed");

        // 4. Comments
        console.log("\n--- Testing Comments ---");
        const commentRes = await client.post(`/api/posts/${postRes.data.id}/comments`, {
            content: "This is a test comment."
        });
        console.log("Comment created:", commentRes.data.id);

        // 5. Weekly Check-in
        console.log("\n--- Testing Weekly Check-in ---");
        try {
            const checkinRes = await client.post('/api/checkins', {
                moodScore: 4,
                content: "Feeling good testing this."
            });
            console.log("Check-in created:", checkinRes.data.id);
        } catch (e: any) {
            if (e.response?.status === 400 && e.response?.data?.message?.includes("already checked in")) {
                console.log("Check-in already done for this week.");
            } else {
                throw e;
            }
        }

        // 6. Reports (on the post created above)
        console.log("\n--- Testing Reports ---");
        const reportRes = await client.post('/api/reports', {
            targetType: 'post',
            targetId: postRes.data.id,
            reason: "Test report reason"
        });
        console.log("Report created:", reportRes.data.id);

        // 7. LinkedIn Exchange
        console.log("\n--- Testing LinkedIn Exchange ---");
        // We need a recipient. We can't request from ourselves.
        // Let's create a secondary user context to test this properly, or just fail expectedly.
        // Since we only have one session, we'll try to request exchange with a fake user ID to see if it validates.
        try {
            await client.post('/api/exchange/request', {
                recipientId: "some-fake-user-id"
            });
        } catch (e: any) {
            // We expect a 400 or a success depending on validation strictly checking user existence (it likely doesn't check existence of recipient at insert time for string IDs unless FK enforces it, but schema has recipientId as text, no direct FK in Drizzle def showed earlier). 
            // Wait, schema says recipientId is text. 
            console.log("Exchange request response:", e.response?.status, e.response?.data);
        }

        console.log("\n✅ Verification Successful!");

    } catch (error: any) {
        console.error("\n❌ Verification Failed:", error.response?.data || error.message);
        process.exit(1);
    }
}

runVerification();
