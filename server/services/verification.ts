import axios from "axios";
import * as cheerio from "cheerio";
import crypto from "crypto";

const BLOCKED_ROLES = [
    "founder", "co-founder", "ceo", "cto", "cfo", "coo", "cpo",
    "managing director", "owner", "partner",
    "head of hr", "hrbp", "people operations", "talent lead",
    "human resources", "hr manager", "director of people"
];

const LINKEDIN_URL_REGEX = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w.-]+\/?$/;

export class VerificationService {
    /**
     * Validates if the string is a valid LinkedIn profile URL
     */
    static validateUrl(url: string): boolean {
        return LINKEDIN_URL_REGEX.test(url);
    }

    /**
     * Hashes a LinkedIn ID with a pepper for anonymity
     * @param linkedinId The stable 'sub' from OAuth 
     * @param pepper System-wide secret pepper
     */
    static hashId(linkedinId: string, pepper: string): string {
        return crypto
            .createHmac("sha256", pepper)
            .update(linkedinId)
            .digest("hex");
    }

    /**
     * Best-effort extraction of role and company from a public LinkedIn profile
     * Note: This is fragile and depends on LinkedIn's public DOM
     */
    static async extractProfileData(url: string): Promise<{ role: string; company: string } | null> {
        try {
            const { data: html } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(html);

            // Selectors for public profiles (these change often)
            const title = $('h2.top-card-layout__headline').text().trim() ||
                $('.text-body-medium.break-words').text().trim();

            const company = $('.top-card-link__description').text().trim() ||
                $('.pv-text-details__right-panel').text().trim();

            if (!title) return null;

            return {
                role: title,
                company: company || "Unknown"
            };
        } catch (error) {
            console.error("LinkedIn Scraping Error:", error);
            return null;
        }
    }

    /**
     * Checks if a role string matches any of the blocked leadership or HR keywords
     */
    static classifyRole(role: string): { isBlocked: boolean; matchedKeyword?: string } {
        const normalizedRole = role.toLowerCase();

        for (const keyword of BLOCKED_ROLES) {
            if (normalizedRole.includes(keyword)) {
                return { isBlocked: true, matchedKeyword: keyword };
            }
        }

        // Additional check for C-level abbreviations
        if (/\bc[efopt]o\b/i.test(normalizedRole)) {
            return { isBlocked: true, matchedKeyword: "C-Level" };
        }

        return { isBlocked: false };
    }
}
