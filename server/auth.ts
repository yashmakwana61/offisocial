import passport from "passport";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import axios from "axios";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage.js";

export function getSession() {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const databaseUrl = process.env.DATABASE_URL?.trim();
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
        conString: databaseUrl,
        createTableIfMissing: false,
        ttl: sessionTtl,
        tableName: "sessions",
    });
    return session({
        secret: process.env.SESSION_SECRET || "default_secret_for_local_dev",
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: sessionTtl,
        },
    });
}

export async function setupAuth(app: Express) {
    app.set("trust proxy", 1);

    // Use Persistent Session Store if DATABASE_URL is present, otherwise MemoryStore
    if (process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
        app.use(getSession());
    } else {
        console.log("[AUTH] Using MemoryStore for local development session.");
        app.use(session({
            secret: process.env.SESSION_SECRET || "default_secret_for_local_dev",
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                secure: false,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            },
        }));
    }

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user: any, cb) => {
        console.log(`[AUTH DEBUG] Serializing user: ${user.id}`);
        cb(null, user.id);
    });
    passport.deserializeUser(async (id: string, cb) => {
        console.log(`[AUTH DEBUG] Deserializing user: ${id}`);
        try {
            const user = await storage.getUser(id);
            if (!user) {
                return cb(null, false);
            }

            const profile = await storage.getProfile(id);
            const enrichedUser = {
                ...user,
                role: profile?.role || "guest",
                username: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "User"
            };

            cb(null, enrichedUser);
        } catch (err) {
            console.error(`[AUTH DEBUG] Deserialize error for ${id}:`, err);
            cb(err);
        }
    });

    console.log("[AUTH DEBUG] Setting up LinkedIn Strategy with OIDC support...");

    // PROTOTYPE OVERRIDE: Ensure all LinkedInStrategy instances use OIDC userinfo endpoint
    // This fixes the 403 error caused by the library using deprecated /v2/me
    const originalUserProfile = (LinkedInStrategy.prototype as any).userProfile;
    (LinkedInStrategy.prototype as any).userProfile = function (accessToken: string, done: (err?: any, profile?: any) => void) {
        console.log("[AUTH DEBUG] Overridden userProfile called! Fetching from OIDC userinfo...");

        // IMPORTANT: LinkedIn requires the access token parameter to be named 'oauth2_access_token'
        // @ts-ignore
        this._oauth2.setAccessTokenName("oauth2_access_token");

        // @ts-ignore - access internal _oauth2
        this._oauth2.get(
            'https://api.linkedin.com/v2/userinfo',
            accessToken,
            (err: any, body: any) => {
                if (err) {
                    console.error("[AUTH DEBUG] OIDC Profile Fetch Error:", err);
                    // Use a generic error if InternalOAuthError isn't available on the strategy class
                    const error = new Error('failed to fetch user profile');
                    (error as any).details = err;
                    return done(error);
                }

                try {
                    const json = JSON.parse(body);
                    console.log("[AUTH DEBUG] OIDC Profile Response received for:", json.sub);
                    const profile: any = {
                        provider: 'linkedin',
                        id: json.sub, // OIDC uses 'sub' instead of 'id'
                        displayName: json.name,
                        name: {
                            givenName: json.given_name,
                            familyName: json.family_name
                        },
                        emails: [{ value: json.email }],
                        photos: [{ value: json.picture }],
                        _raw: body,
                        _json: json
                    };
                    done(null, profile);
                } catch (e) {
                    console.error("[AUTH DEBUG] OIDC Profile Parse Error:", e);
                    done(e);
                }
            }
        );
    };

    const strategy = new LinkedInStrategy(
        {
            clientID: process.env.LINKEDIN_CLIENT_ID!,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
            callbackURL: process.env.LINKEDIN_CALLBACK_URL || "http://localhost:5000/api/auth/linkedin/callback",
            scope: ["openid", "profile", "email"],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
            try {
                const linkedinId = profile.id;
                console.log(`[AUTH DEBUG] Strategy verify callback for LinkedIn ID (sub): ${linkedinId}`);

                // Create anonymous user data
                const userData = {
                    firstName: profile.name?.givenName || "Anonymous",
                    lastName: profile.name?.familyName || "Employee",
                    email: profile.emails?.[0]?.value || `anon-${linkedinId.slice(0, 8)}@employee.internal`,
                };

                const newUser = await storage.upsertUser(userData);
                const userProfile = await storage.getProfile(newUser.id);

                if (!userProfile) {
                    // Create profile - setting to verified_full by default as requested
                    await storage.createProfile(
                        newUser.id,
                        "Software Professional",
                        "LinkedIn Verified",
                        linkedinId,
                        "verified_full"
                    );
                }

                console.log(`[AUTH DEBUG] Verify callback successful for user: ${newUser.id}`);
                return done(null, newUser);
            } catch (err) {
                console.error("[AUTH DEBUG] Strategy verify callback error:", err);
                return done(err);
            }
        }
    );

    passport.use(strategy);

    // Auth Status Routes
    app.get("/api/auth/user", (req, res) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        res.json(req.user);
    });

    app.get("/api/logout", (req, res, next) => {
        req.logout((err) => {
            if (err) return next(err);
            res.redirect("/");
        });
    });

    // DEV ONLY: Mock Login for testing/verification
    if (app.get("env") !== "production") {
        app.post("/api/auth/dev-login", async (req, res, next) => {
            const email = req.body.email || "dev@local.test";
            try {
                const existingUser = await storage.getUserByEmail(email).catch(() => undefined);
                let user = existingUser;

                if (!user) {
                    user = await storage.upsertUser({
                        email,
                        firstName: "Dev",
                        lastName: "User",
                    });
                }

                // Ensure profile exists
                const existingProfile = await storage.getProfile(user.id);
                if (!existingProfile) {
                    await storage.createProfile(
                        user.id,
                        "Software Engineer",
                        "Tech Corp",
                        "dev-linkedin-id",
                        "verified_full"
                    );
                }

                req.login(user, (err) => {
                    if (err) return next(err);
                    return res.json(user);
                });
            } catch (err) {
                next(err);
            }
        });
    }
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: "Unauthorized" });
};
