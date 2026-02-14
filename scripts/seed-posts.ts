import { db } from "../server/db.js";
import { companies, users, profiles, posts, comments, POST_CATEGORIES, reactions } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";

async function seed() {
    console.log("🌱 Starting enhanced seeding...");

    if (!db) {
        console.error("❌ Database connection not established. Check DATABASE_URL.");
        process.exit(1);
    }

    // 1. Get all existing companies or create "Professional Community" if none
    console.log("🏢 Fetching companies...");
    let allCompanies = await db.query.companies.findMany();

    if (allCompanies.length === 0) {
        const [newCompany] = await db.insert(companies).values({
            name: "Professional Community",
            domain: "professional.community",
        }).returning();
        allCompanies = [newCompany];
    }

    // 2. Create User Personas (Increased to 15 for more variety)
    console.log("👤 Creating personas...");
    const personaData = [
        { first: "Alex", last: "Chen", role: "Sr. Software Engineer" },
        { first: "Sarah", last: "Miller", role: "Product Manager" },
        { first: "Jordan", last: "Smith", role: "HR Specialist" },
        { first: "Casey", last: "Li", role: "Engineering Manager" },
        { first: "Taylor", last: "Garcia", role: "Junior Developer" },
        { first: "Morgan", last: "White", role: "UX Lead" },
        { first: "Robin", last: "Patel", role: "Data Scientist" },
        { first: "Drew", last: "Jones", role: "Staff Architect" },
        { first: "Sky", last: "Velez", role: "SRE" },
        { first: "Jamie", last: "Kim", role: "Growth Marketing" },
        { first: "Sam", last: "Brown", role: "Principal Engineer" },
        { first: "Chris", last: "Davis", role: "Technical Writer" },
        { first: "Avery", last: "Wilson", role: "Sales Engineer" },
        { first: "Quinn", last: "Moore", role: "Security Engineer" },
        { first: "Riley", last: "Taylor", role: "Android Developer" },
    ];

    const seededUsers = [];

    for (const p of personaData) {
        const email = `${p.first.toLowerCase()}.${p.last.toLowerCase()}@example.com`;
        let user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            const id = crypto.randomUUID();
            const [newUser] = await db.insert(users).values({
                id,
                email,
                firstName: p.first,
                lastName: p.last,
            }).returning();
            user = newUser;

            await db.insert(profiles).values({
                userId: user.id,
                companyId: allCompanies[0].id,
                role: p.role,
                accountStatus: "verified_full",
                verificationStep: "completed",
            });
        }
        seededUsers.push({ id: user.id, role: p.role });
    }

    // 3. Generate 100 Unique Posts
    console.log("📝 Generating 100 unique posts...");
    const postCategories = [
        {
            name: "Mental Stress / Burnout",
            templates: [
                "Is it just me or is the 'always-on' culture getting worse? I feel guilty for taking a lunch break.",
                "How do you all manage the pressure of tight deadlines without sacrificing sleep?",
                "I've been feeling zero motivation lately. Is this burnout or just a phase?",
                "My team recently started doing 8 AM daily standups. It's killing my work-life balance.",
                "The cognitive load of switching between 15 different projects is too much.",
                "I just realized I haven't taken a proper vacation in two years. Don't be like me.",
                "Anyone else find 'unlimited PTO' actually results in taking less time off?",
                "What are some healthy ways to disconnect after a stressful deployment?",
                "Management says they care about mental health, but their actions say otherwise.",
                "I feel like I'm drowning in Slack notifications. How do you mute the noise?",
            ],
        },
        {
            name: "Toxic Work Culture",
            templates: [
                "My manager expects me to respond to messages within 5 minutes, even during 'deep work' hours.",
                "I'm tired of the 'we're like a family' narrative being used to justify unpaid overtime.",
                "Has anyone successfully handled a coworker who constantly talks over everyone in meetings?",
                "The favoritism in my department is becoming too obvious to ignore.",
                "I was told to 'stay in my lane' when I pointed out a major security flaw. Is this common?",
                "Our team has a 50% attrition rate in the last 6 months. HR still says everything is fine.",
                "A senior dev just called my PR 'embarrassing' in a public channel. Is this acceptable?",
                "We have 'Mandatory Fun' events that feel more like extra chores after work.",
                "Micromanagement at its finest: I now have to log my tasks every hour.",
                "Is 'culture fit' just a code word for 'someone who looks and thinks like us'?",
            ],
        },
        {
            name: "Need Referral / Job Help",
            templates: [
                "I'm a mid-level SDE looking to transition into Cloud Engineering. Any certifications worth getting?",
                "Anyone at a Tier-1 Fintech? I'm curious about the engineering culture there.",
                "I've been through 5 rounds of interviews at a big tech firm and still no decision. Normal?",
                "Resumes: Do people actually still care about cover letters for technical roles?",
                "I have a referral available for 2 Backend Sr. SDE roles. DM if you have 8+ years experience.",
                "What's the best way to explain a 6-month career gap during an interview?",
                "Negotiation tips: I have two offers but they are very different in terms of equity vs base.",
                "System Design: What resources are people using these days? DDIA is great but looking for more.",
                "Looking to move from Android to iOS. Any advice on how to frame my experience?",
                "Ghosting after technical rounds is becoming a huge problem. Let's fix this, recruiters!",
            ],
        },
        {
            name: "Policy / Work Discussion",
            templates: [
                "What's your stance on the new Hybrid work policy? 3 days in office feels unnecessary.",
                "Does your company offer tuition reimbursement? Trying to see if it's worth the paperwork.",
                "Performance reviews are coming up. How do you track your wins throughout the year?",
                "Equity options: Is anyone actually seeing a payout, or is it mostly 'paper money'?",
                "Our company just implemented AI monitoring for productivity. Thoughts?",
                "Why is it so hard for companies to be transparent about salary bands?",
                "Is your work-life balance better at a startup or a large corporation?",
                "Has anyone successfully negotiated a 4-day work week?",
                "What's the best perk your company offers that isn't just free food?",
                "With the recent market shifts, how stable do you feel in your current role?",
            ],
        },
        {
            name: "General Experience",
            templates: [
                "Lesson learned: Writing the code is the easy part; getting consensus is the hard part.",
                "Soft skills are so underrated. I've seen mediocre coders get promoted because they can communicate.",
                "I've realized that the 'dream job' doesn't exist. It's just about finding a place where you're respected.",
                "What's one thing you wish you knew on your first day of your first tech job?",
                "The best career move I ever made was leaving a 'comfortable' job for a challenging one.",
                "Seniority isn't about years; it's about how many times you've broken production and fixed it.",
                "How do you stay updated with the fast-moving tech landscape without burning out?",
                "Is anyone still using PHP for new projects, or is it mostly Node/Go/Python now?",
                "Documentation is like insurance: You hate doing it until you desperately need it.",
                "Mentorship changed my life. How can I give back to junior devs in a meaningful way?",
            ],
        },
    ];

    const allPosts = [];
    for (let i = 0; i < 100; i++) {
        const categoryObj = postCategories[i % postCategories.length];
        const templateIdx = Math.floor(i / postCategories.length) % categoryObj.templates.length;
        const baseContent = categoryObj.templates[templateIdx];

        // Add small variations to avoid identical-looking strings
        const variations = [
            "", " Thoughts?", " Anyone else?", " Just venting.", " Real talk.", " Is this the norm?",
            " (Posting this anonymously for obvious reasons)", " Looking for advice.", " Just my two cents."
        ];
        const finalContent = baseContent + variations[i % variations.length];

        const user = seededUsers[i % seededUsers.length];
        const company = allCompanies[i % allCompanies.length];

        const [post] = await db.insert(posts).values({
            companyId: company.id,
            authorId: user.id,
            content: finalContent,
            category: categoryObj.name as any,
        }).returning();
        allPosts.push(post);
    }

    // 4. Generate 250+ Unique Comments (Massive diversity)
    console.log("💬 Adding 250+ unique comments...");
    const commentPool = [
        "I feel this deeply. It's the same in my department.",
        "Interesting. Have you tried setting specific blocks for deep work on your calendar?",
        "Totally agree. The family narrative is a huge red flag.",
        "I'm in a similar boat. Thinking about updating my resume this weekend.",
        "Thanks for sharing. It's good to know I'm not the only one feeling this way.",
        "Have you spoken to your manager about this yet?",
        "This is why I prefer remote work. Much easier to set boundaries.",
        "Honestly, it might be time to look for a new team if the culture is that bad.",
        "Negotiation is key. Don't leave money on the table!",
        "DDIA is still the gold standard, but check out 'System Design Interview' by Alex Xu.",
        "In my experience, startups are way more stressful but you learn 5x faster.",
        "Mentorship is about listening first, then advising.",
        "Documentation is truly the gift you give to your future self.",
        "Try muting all Slack channels except the ones where you're specifically tagged.",
        "That sounds like a classic case of micromanagement. Very common but very annoying.",
        "I've found that being transparent about my capacity helped a lot with the burnout.",
        "Don't ignore those Sundays Scaries. Your body is trying to tell you something.",
        "Is the new RTO policy being strictly enforced, or is it more of a suggestion?",
        "I've had that same architecture discussion. Sometimes it's better to just build a prototype to prove your point.",
        "Soft skills are what get you from Senior to Staff/Principal.",
        "Focus on your impact, not your hours. That's what really matters for promos.",
        "I'd love a referral if you're still offering! Sent you a DM.",
        "The market is definitely weird right now. Stability is top of mind for everyone.",
        "I've learned to say 'No' more often. It's a superpower.",
        "How are you all handling the balance between IC work and helping juniors?",
        "Great advice. I wish I knew this 5 years ago.",
        "The favoritism issue is so soul-crushing. Sorry you're going through that.",
        "Identity as a family is fine for social events, but not for business decisions.",
        "Is your SRE team hiring? I have a background in Kubernetes and Terraform.",
        "Stay strong. Tech can be a grind but there are good teams out there.",
        "I've found that being transparent about my capacity helped a lot with the burnout.",
        "Documentation should be part of the Definition of Done.",
        "I'm curious, what's your tech stack? We're moving to Go and it's been great.",
        "Burnout is real. Please take care of yourself first.",
        "I suspect RTO is just silent downsizing. Too many companies doing it at once.",
        "Unlimited PTO works best when the leadership team actually takes time off.",
        "Technical writing is a very valuable skill for engineers.",
        "Is it just me, or are meetings starting earlier and earlier in the day?",
        "I've started telling my team that I'm offline after 6 PM. Life-changing.",
        "The 4-day work week is the future. I hope more companies wake up to it.",
        "Equity is a lottery ticket. Value the base and the bonus more.",
        "I've seen this happen at three different companies now. It's a systemic issue.",
        "Have you checked Glassdoor or Levels.fyi to see if this is common for your level?",
        "Don't let them gaslight you. If it feels wrong, it probably is.",
        "I highly recommend the 'Managers Path' book for anyone feeling stuck in tech.",
        "Is your team using Agile or just 'Chaos with Jira'?",
        "I've found that a 15-minute walk midday does wonders for my focus.",
        "Does your company do 'No Meeting Wednesdays'? It's a game-changer.",
        "Remember: You are more than your job title.",
        "The best way to get a raise is to get a new job. Sad but true.",
        "I'm a hiring manager. If you can explain your gap with a project, you're fine.",
        "Don't sacrifice your health for a company that would replace you in a week.",
        "I've started using AI for boilerplates and it's saved me hours.",
        "How do you handle 'Quiet Quitting' in your team? Is it actually common?",
        "We just switched to a flat hierarchy. It's... interesting so far.",
        "I've had success with 'Focus Friday' where we all turn off Slack.",
        "Identity in tech is tied too much to the languages we use. Be a polyglot!",
        "I'm looking for a UX mentor. Does anyone have experience with B2B SaaS?",
        "The interview process these days is basically a second full-time job.",
        "I miss the days of simple technical interviews without Leetcode hard.",
        "Is it just me or is LinkedIn becoming a parody of itself?",
        "I've found that being the 'glue' person is rewarding but often unrecognized.",
        "How do you manage your 'To-Do' list? I'm struggling with overload.",
        "Startups are great for broad experience; Big Tech is great for deep scale.",
        "I've learned to value my peace of mind over a prestigious title.",
        "If they don't value your PRs, they don't value your growth.",
        "RTO is a dealbreaker for me now. Remote work is the new baseline.",
        "I'm curious about the 'Pod' structure. Does it actually improve velocity?",
        "Burnout doesn't always look like exhaustion; sometimes it looks like cynicism.",
        "I've started doing 'Deep Work' sessions from 8 AM to 11 AM. Highly recommend.",
        "Does anyone else feel like they spend 80% of their time in Zoom/Meet?",
        "The best career advice I got was: 'Be the person people want to work with again.'",
        "Salary transparency should be a legal requirement everywhere.",
        "I've seen too many 'family' cultures use that as an excuse for poor boundaries.",
        "What's your favorite VS Code extension for productivity?",
        "I'm trying to learn Rust but the borrow checker is my new nemesis.",
        "Is there a way to automate our sprint reports? It's so manual right now.",
        "I've found that 'Coffee Chats' are still valuable even in a remote world.",
        "Don't let them trick you into a title bump without a salary bump.",
        "I'm considering a move into Management. Any 'gotchas' I should know?",
        "Leadership is about clearing roadblocks, not giving directions.",
        "I've started using a physical whiteboard for my daily tasks. So satisfying.",
        "Is anyone using Copilot? Does it actually help or just create more bugs?",
        "I've realized that my 'dream company' was actually a nightmare in reality.",
        "How do you handle a teammate who takes credit for your work?",
        "Documentation is how you scale yourself. Write it once, share it forever.",
        "I'm a big fan of 'Ship Small, Ship Often'. It reduces so much stress.",
        "The market will bounce back. Just keep sharpening your saw.",
        "I've found that a good morning routine sets the tone for the whole day.",
        "Don't compare your Chapter 1 to someone else's Chapter 20.",
        "I'm looking for a referral for a Senior Frontend role in Berlin/Remote.",
        "Is anyone else tired of the 'Hustle' culture?",
        "I've started tracking my 'Deep Work' hours. Seeing the data is motivating.",
        "What's the most underrated skill in engineering? Empathetic listening.",
        "I've found that a simple 'Thank You' goes a long way in peer reviews.",
        "Don't be afraid to ask 'Stupid Questions'. They usually aren't stupid.",
        "I'm currently working on a side project to learn Next.js 14. It's impressive.",
        "How do you handle 1-on-1s? I feel like mine are just status updates.",
        "The best managers are the ones who trust you to do the job they hired you for.",
        "I've learned to focus on what I can control and let go of the rest.",
        "Is it just me or is every company 'Data-Driven' until the data says something they don't like?",
        "I'm looking for advice on how to transition into Fintech.",
        "Don't let a bad day turn into a bad week. Take a breath.",
        "I've found that 'Automated Testing' is the only way to move fast safely.",
        "What's your favorite professional podcast for tech leadership?",
        "I'm trying to build a 'Personal Brand' but it feels so corporate.",
        "The best thing about being a Senior is saying 'I don't know' without fear.",
        "I've realized that my best ideas come when I'm NOT at my desk.",
        "How do you stay motivated during a long-term project with no clear end?",
        "Is anyone else seeing a rise in 'Ghost Jobs' on hiring platforms?",
        "I've found that a good manager is more important than a good product.",
        "Don't forget to celebrate the small wins. They add up.",
        "I'm looking for a referral for a DevOps lead role. 10 years experience.",
        "Is it just me or is the 'Tech Bubble' finally bursting, or just shifting?",
        "I've started doing 'Walking Meetings' for my 1-on-1s. It's refreshing.",
        "What's the best piece of feedback you've ever received?",
        "I've learned that 'Perfect is the enemy of Progress'. Just get it out there.",
        "How do you handle 'Scope Creep' in your projects?",
        "The most successful people I know are the ones who are constantly learning.",
        "I've found that a simple 'How are you?' can change someone's day.",
        "Don't be the smartest person in the room. If you are, you're in the wrong room.",
        "I'm currently obsessed with 'Obsidian' for my personal knowledge base.",
        "How do you handle 'Merge Conflict' anxiety? I still get it after 10 years.",
        "The best code is the code you didn't have to write.",
        "I've realized that I'm more of an IC than a Manager. And that's okay.",
        "How do you stay current with AI developments without feeling overwhelmed?",
        "Is anyone at a company that actually does 'Retros' correctly?",
        "I've found that a physical 'Done List' is more satisfying than a To-Do list.",
        "Don't let your self-worth be tied to your career path.",
        "I'm looking for a referral for a Principal Architect role in NYC/Hybrid.",
        "Is it just me or are 'Take-Home' assignments getting out of hand?",
        "I've started using 'Brain Dumping' at the end of the day to clear my head.",
        "What's your favorite 'Zen' thing to do after a long day of coding?",
        "I've learned to value 'Consistency over Intensity'.",
        "How do you handle 'Imposter Syndrome' at a new job?",
        "The most valuable thing you have is your time. Spend it wisely.",
        "I've found that 'Peer Programming' is great for difficult bugs.",
        "What's your go-to 'Focus Music'? For me, it's Lofi or Synthwave.",
        "I'm currently trying to master 'GraphQL'. Any good tutorials?",
        "Don't be afraid to take a step back to take two steps forward.",
        "I've realized that I work best in the afternoon, not the morning.",
        "How do you handle 'Technical Debt' in a fast-paced environment?",
        "The best engineers are the ones who can explain complex things simply.",
        "I've found that a simple 'Desk Reset' helps me start fresh every morning.",
        "What's the one thing you would change about the tech industry?",
        "I'm currently learning 'Kubernetes' and it's a bit of a learning curve.",
        "Don't let 'Analysis Paralysis' stop you from making a decision.",
        "I've realized that my 'Productivity Hacks' were mostly just distractions.",
        "How do you handle a 'Micro-manager' without quitting?",
        "The best way to learn is to teach others. Start a blog or a YouTube channel.",
        "I've found that a good 'Ergonomic Setup' is worth every penny.",
        "What's your favorite way to 'Disconnect' on the weekends?",
        "I'm currently reading 'Atomic Habits' and it's changing my perspective.",
        "Don't be afraid to say 'No' to meetings that could have been an email.",
        "I've realized that my 'Career Goals' have shifted since I started.",
        "How do you handle 'Project Fatigue' on a multi-year project?",
        "The most important thing I've learned is to 'Ask for Help' early.",
        "I've found that a simple 'Smile' in a Zoom call can make it less awkward.",
        "What's your favorite way to 'Celebrate' a successful launch?",
        "I'm currently learning 'Tailwind CSS' and I'm never going back.",
        "Don't let 'Comparison' be the thief of your joy.",
        "I've realized that I need 'Quiet Time' to be truly productive.",
        "How do you handle 'Negative Feedback' from a peer?",
        "The best code is the code that is easy to read and maintain.",
        "I've found that a simple 'Check-in' with a coworker can build a lot of trust.",
        "What's your favorite 'Productivity App'? Mine is Trello.",
        "I'm currently master 'React Server Components'. It's a bit confusing.",
        "Don't be afraid to 'Fail Fast' and learn from it.",
        "I've realized that I work best when I have a 'Clear Goal' for the day.",
        "How do you handle 'Miscommunication' in a remote team?",
        "The most successful engineers are the ones who are 'Collaborative'.",
        "I've found that a simple 'Walk' can spark my best ideas.",
        "What's the one thing you wish you knew before becoming a Senior?",
        "I'm currently learning 'Cypress' for E2E testing. It's very powerful.",
        "Don't let 'Fear of Failure' stop you from trying something new.",
        "I've realized that I need 'Variety' in my work to stay engaged.",
        "How do you handle 'Burnout' symptoms before they become critical?",
        "The best way to grow is to 'Step Outside Your Comfort Zone'.",
        "I've found that a simple 'Thank You' note can go a long way.",
        "What's your favorite 'Coding Resource'? Mine is MDN.",
        "I'm currently learning 'TypeScript' and it's saving me so many bugs.",
        "Don't be afraid to 'Pivoting' your career if it's not working.",
        "I've realized that I need 'Regular Feedback' to stay on track.",
        "How do you handle 'Conflict' in a professional way?",
        "The most important skill in tech is 'Problem Solving'.",
        "I've found that a simple 'Breathe' can help in a stressful meeting.",
        "What's your favorite 'Career Book'? Mine is 'Designing Your Life'.",
        "I'm currently learning 'Docker' and it's making deployment so much easier.",
        "Don't let 'Stagnation' be the reason you leave a job.",
        "I've realized that I need 'Autonomy' to be truly happy at work.",
        "How do you handle 'Unrealistic Deadlines' from management?",
        "The best engineers are the ones who are 'Curious' about how things work.",
        "I've found that a simple 'High Five' (virtual or real) can boost morale.",
        "What's the one thing you would tell your younger self?",
        "I'm currently learning 'Playwright' and it's refreshing.",
        "Don't be afraid to 'Speak Up' if something isn't right.",
        "I've realized that I need 'Social Connection' even as an introvert.",
        "How do you handle 'Information Overload' in your daily life?",
        "The most successful people are the ones who 'Take Action'.",
        "I've found that a simple 'Compliment' can make someone's day.",
        "What's your favorite 'Tech Blog'? Mine is Overreacted.",
        "I'm currently learning 'Svelte' and it's so much fun.",
        "Don't let 'Perfectionism' hold you back from shipping.",
        "I've realized that I need 'Growth Opportunities' to stay motivated.",
        "How do you handle 'Difficult Conversations' with your boss?",
        "The best way to learn is by 'Doing'. Build something today!",
        "I've found that a simple 'Stretch' can help me stay focused.",
        "What's the one thing you love about your job?",
        "I'm currently learning 'Astro' and it's very cool for content sites.",
        "Don't be afraid to 'Reinvent Yourself' as many times as needed.",
        "I've realized that I need 'Purpose' in my work.",
        "How do you handle 'Distractions' when working from home?",
        "The most important thing is to 'Be Kind' to yourself and others.",
        "I've found that a simple 'Tea Break' can be very restorative.",
        "What's your favorite professional quote? Mine is 'Done is better than perfect'.",
        "I'm currently learning 'Zod' and it's amazing for validation.",
        "Don't let 'Imposter Syndrome' win today.",
        "I've realized that I'm exactly where I need to be right now.",
        "How do you handle 'Change' in a fast-paced environment?",
        "The best way to predict the future is to 'Create It'.",
        "I've found that a simple 'Pause' can help me respond instead of react.",
        "What's the one thing you are most proud of in your career?",
    ];

    for (let j = 0; j < 250; j++) {
        const post = allPosts[Math.floor(Math.random() * allPosts.length)];
        const user = seededUsers[Math.floor(Math.random() * seededUsers.length)];
        const content = commentPool[j % commentPool.length] + (j > 100 ? " " + (j % 7 === 0 ? "Hope this helps!" : "Real talk.") : "");

        await db.insert(comments).values({
            postId: post.id,
            authorId: user.id,
            content: content,
        });
    }

    // 5. Generate 600+ Reactions
    console.log("👍 Adding 600+ reactions...");
    for (const post of allPosts) {
        const reactionCount = Math.floor(Math.random() * 15) + 5; // 5-20 reactions per post
        const shuffeledUsers = [...seededUsers].sort(() => 0.5 - Math.random());
        const reactingUsers = shuffeledUsers.slice(0, reactionCount);

        for (const user of reactingUsers) {
            await db.insert(reactions).values({
                targetType: "post",
                targetId: post.id,
                userId: user.id,
                type: Math.random() > 0.4 ? "support" : "helpful",
            });
        }
    }

    console.log("✅ Enhanced seeding complete! 100 posts, 250 comments, and 600+ reactions added.");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
