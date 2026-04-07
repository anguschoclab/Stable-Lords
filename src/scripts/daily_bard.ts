import fs from "fs";
import path from "path";
import OpenAI from "openai";

const NARRATIVE_FILE = path.join(process.cwd(), "src/data/narrativeContent.json");
const REPORT_FILE = path.join(process.cwd(), "Daily_Bard_Report.md");

// Initialize OpenAI client (requires process.env.OPENAI_API_KEY)
// For local simulation if no key is provided, we will mock the response to avoid failing completely.
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "mock-key",
});

interface NarrativeData {
    ATTACK_TEMPLATES: Record<string, string[]>;
    KILL_TEMPLATES: string[];
    MOOD_TONE: Record<string, { adjectives: string[]; opener: string[]; closer: string[] }>;
}

async function getNewTemplates(prompt: string, count: number): Promise<string[]> {
    if (process.env.OPENAI_API_KEY) {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini", // Cost efficient model for narrative gen
                messages: [
                    { role: "system", content: "You are the Bard of the Blood Sands, generating gruesome, high-fantasy arena combat descriptions." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.9,
            });
            const text = response.choices[0]?.message?.content || "";
            // Parse out lines that look like templates (simple extraction)
            return text.split('\n')
                .map(line => line.trim())
                .filter(line => line.startsWith('"') && line.endsWith('"'))
                .map(line => line.substring(1, line.length - 1))
                .slice(0, count);
        } catch (error) {
            console.error("OpenAI API Error:", error);
            return [];
        }
    } else {
        // Mock generation for sandbox / test without an API key
        console.log("No OPENAI_API_KEY found, returning mock data for prompt:", prompt.substring(0, 50) + "...");
        const mocks = [];
        for (let i = 0; i < count; i++) {
            const suffix = ` (Mock ${i})`;
            if (prompt.includes("KILL_TEMPLATES")) {
                mocks.push(`%A executes %D with a chilling, masterful strike that sends a spray of crimson across the sands!${suffix}`);
            } else if (prompt.includes("ATTACK_TEMPLATES")) {
                mocks.push(`%N unleashes a terrifying barrage with his %W, forcing his opponent into a desperate retreat!${suffix}`);
            } else if (prompt.includes("MOOD_TONE")) {
                mocks.push(`A horrifying symphony of steel and slaughter opened this week's bouts!${suffix}`);
            } else {
                mocks.push(`A generic mock line.${suffix}`);
            }
        }
        return mocks;
    }
}

async function main() {
    console.log("📜 The Bard of the Blood Sands is waking up...");

    let data: NarrativeData;
    try {
        const rawData = fs.readFileSync(NARRATIVE_FILE, "utf-8");
        data = JSON.parse(rawData);
    } catch (err) {
        console.error("Failed to read narrative data:", err);
        return;
    }

    let changed = false;
    let reportLog = "## The Bard's Additions\n\n";

    // 1. Check and expand KILL_TEMPLATES
    if (data.KILL_TEMPLATES.length < 500) { // Arbitrary endless cap for now
        console.log(`Current Kill Templates: ${data.KILL_TEMPLATES.length}. Generating new ones...`);
        const prompt = `Generate 3 new KILL_TEMPLATES. They must be a single sentence string. Use %A for the attacker/winner and %D for the defender/loser. Example: "A fountain of gore erupts as %A's final strike decapitates %D!" Wrap each in double quotes on its own line.`;
        const newKills = await getNewTemplates(prompt, 3);
        if (newKills.length > 0) {
            data.KILL_TEMPLATES.push(...newKills);
            changed = true;
            reportLog += "### New Kill Templates:\n";
            newKills.forEach(k => reportLog += `- ${k}\n`);
        }
    }

    // 2. Check and expand ATTACK_TEMPLATES (Slash)
    const slashLen = data.ATTACK_TEMPLATES.slash.length;
    if (slashLen < 200) {
        console.log(`Current Slash Attack Templates: ${slashLen}. Generating new ones...`);
        const prompt = `Generate 3 new ATTACK_TEMPLATES for a "slash" weapon type. Use %N for the attacker, %D for defender (optional), and %W for the weapon. Example: "%N whips his %W blade back and forth as if to slash his foe to ribbons!" Wrap each in double quotes on its own line.`;
        const newAttacks = await getNewTemplates(prompt, 3);
        if (newAttacks.length > 0) {
            data.ATTACK_TEMPLATES.slash.push(...newAttacks);
            changed = true;
            reportLog += "### New Slash Attack Templates:\n";
            newAttacks.forEach(a => reportLog += `- ${a}\n`);
        }
    }

    // 3. Expand Gazette MOOD_TONE (Bloodthirsty Openers)
    if (data.MOOD_TONE.Bloodthirsty && data.MOOD_TONE.Bloodthirsty.opener.length < 100) {
        console.log(`Current Bloodthirsty Openers: ${data.MOOD_TONE.Bloodthirsty.opener.length}. Generating new ones...`);
        const prompt = `Generate 2 new MOOD_TONE openers for the "Bloodthirsty" crowd mood in an arena combat game. They should be a single dramatic sentence. Example: "Gore choked the drains this week as the arena reached new heights of depravity!" Wrap each in double quotes on its own line.`;
        const newOpeners = await getNewTemplates(prompt, 2);
        if (newOpeners.length > 0) {
            data.MOOD_TONE.Bloodthirsty.opener.push(...newOpeners);
            changed = true;
            reportLog += "### New Bloodthirsty Openers:\n";
            newOpeners.forEach(o => reportLog += `- ${o}\n`);
        }
    }

    if (changed) {
        fs.writeFileSync(NARRATIVE_FILE, JSON.stringify(data, null, 2), "utf-8");
        fs.writeFileSync(REPORT_FILE, reportLog, "utf-8");
        console.log("\n✅ The Bard has successfully transcribed new lore into the archives.");
        console.log("Wrote updates to src/data/narrativeContent.json and generated Daily_Bard_Report.md");
    } else {
        console.log("\nNo new lore was generated today.");
    }
}

main().catch(console.error);
