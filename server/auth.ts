import passport from "passport";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import axios from "axios";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage.js";
import { VerificationService } from "./services/verification.js";

export function getSession() {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
        conString: process.env.DATABASE_URL,
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

    passport.serializeUser((user: any, cb) => cb(null, user.id));
    passport.deserializeUser(async (id: string, cb) => {
        try {
            const user = await storage.getUser(id);
            cb(null, user);
        } catch (err) {
            cb(err);
        }
    });

    // Mock Auto-login for local development without LinkedIn credentials
    if (!process.env.LINKEDIN_CLIENT_ID || process.env.NODE_ENV !== "production") {
        console.log("[AUTH] Setting up Local Mock Auto-login...");

        const MOCK_USER_DATA = {
            id: "local-user-1",
            firstName: "Local",
            lastName: "User",
            email: "local@test.com",
        };

        app.use(async (req, res, next) => {
            if (!req.path.startsWith("/api") || req.path === "/api/logout") return next();

            if (!req.isAuthenticated()) {
                console.log(`[AUTH DEBUG] Auto-logging in user to session: ${req.sessionID}`);
                const user = await storage.upsertUser(MOCK_USER_DATA);
                req.login(user, (err) => {
                    if (err) return next(err);
                    req.session.save((serr) => {
                        if (serr) console.error("[AUTH DEBUG] Session save failed:", serr);
                        next();
                    });
                });
            } else {
                next();
            }
        });
    }

    // LinkedIn Strategy
    if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
        // Override for OIDC compatibility
        // @ts-ignore
        LinkedInStrategy.prototype.userProfile = function (accessToken: string, done: (err?: Error | null, profile?: any) => void) {
            console.log("[AUTH DEBUG] Fetching LinkedIn user profile...");

            axios.get('https://api.linkedin.com/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            })
                .then((res: any) => {
                    const json = res.data;
                    console.log("[AUTH DEBUG] LinkedIn user profile received:", {
                        sub: json.sub,
                        email: json.email,
                        name: json.name
                    });

                    var profile = {
                        provider: 'linkedin',
                        id: json.sub,
                        displayName: json.name,
                        name: {
                            givenName: json.given_name,
                            familyName: json.family_name
                        },
                        emails: [{ value: json.email }],
                        photos: [{ value: json.picture }],
                        _raw: JSON.stringify(json),
                        _json: json
                    };
                    done(null, profile);
                })
                .catch((err: any) => {
                    console.error("[AUTH DEBUG] LinkedIn profile fetch error:", err?.response?.data || err?.message || err);
                    done(err);
                });
        };

        passport.use(
            new LinkedInStrategy(
                {
                    clientID: process.env.LINKEDIN_CLIENT_ID,
                    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
                    callbackURL: process.env.LINKEDIN_CALLBACK_URL || "http://localhost:5000/api/auth/linkedin/callback",
                    scope: ["openid", "profile", "email"],
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        const linkedinId = profile.id;
                        console.log(`[AUTH DEBUG] Strategy verify callback for ID: ${linkedinId}`);

                        const pepper = process.env.LINKEDIN_PEPPER || "antigravity_default_pepper";
                        const hashedId = VerificationService.hashId(linkedinId, pepper);

                        // Check if profile exists with this hashed ID
                        let existingProfile = await storage.getProfileByHashedId(hashedId);

                        if (existingProfile) {
                            const user = await storage.getUser(existingProfile.userId);
                            return done(null, user);
                        }

                        // Create anonymous user
                        const userData = {
                            firstName: "Anonymous",
                            lastName: "Employee",
                            email: `anon-${hashedId.slice(0, 8)}@employee.internal`, // Placeholder
                        };

                        const newUser = await storage.upsertUser(userData);
                        const userProfile = await storage.getProfile(newUser.id);

                        if (!userProfile) {
                            // Create profile - setting to verified_full by default as requested
                            await storage.createProfile(
                                newUser.id,
                                "Software Professional",
                                "LinkedIn Verified",
                                hashedId,
                                "verified_full"
                            );
                        } else if (userProfile.accountStatus === "pending") {
                            // Automatically verify returning users who were pending
                            await storage.updateProfileVerification(newUser.id, {
                                accountStatus: "verified_full",
                                verificationStep: "completed"
                            });
                        }

                        return done(null, newUser);
                    } catch (err) {
                        return done(err);
                    }
                }
            )
        );
    }

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
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: "Unauthorized" });
};
