const { cmd } = require('../command');
const axios = require('axios');

// APK Search Command
cmd({
    pattern: "apkpure",
    desc: "Search and download APKs",
    use: ".apkpure <app_name>",
    react: "📥",
    category: "download",
    filename: __filename,
},
async (conn, mek, m, { args, reply }) => {
    try {
        const query = args.join(" ").trim();
        if (!query) {
            return reply("❌ Please provide an app name. Example: `.apk telegram`");
        }

        reply("Searching for APKs...");

        const response = await axios.get(`https://apkpure.com/search?q=${encodeURIComponent(query)}`);
        const html = response.data;

        // Extract APK details using regex
        const regex = /<a href="(\/[a-z-]+\/[a-z0-9-]+)" title="(.+?)"/g;
        let match;
        let results = [];
        while ((match = regex.exec(html)) !== null) {
            const link = `https://apkpure.com${match[1]}`;
            const title = match[2];
            results.push({ title, link });
            if (results.length >= 10) break;
        }

        if (results.length === 0) {
            return reply(`❌ No results found for "${query}".`);
        }

        // Prepare and send interactive menu
        let menuText = `🔍 **APK Results for:** ${query}\n\n`;
        results.forEach((item, index) => {
            menuText += `${index + 1}. ${item.title}\n`;
        });
        menuText += `\n🗂 Reply with a number (1-10) to get the APK link.`;

        const sentMessage = await conn.sendMessage(m.chat, { text: menuText }, { quoted: mek });

        // Listen for user reply
        conn.ev.on("messages.upsert", async (msgUpdate) => {
            const userMsg = msgUpdate.messages[0];
            if (!userMsg.message || !userMsg.message.conversation) return;

            const selectedOption = parseInt(userMsg.message.conversation.trim());
            if (isNaN(selectedOption) || selectedOption < 1 || selectedOption > results.length) {
                return conn.sendMessage(m.chat, { text: "❌ Invalid option. Please reply with a number between 1 and 10." }, { quoted: userMsg });
            }

            const selectedAPK = results[selectedOption - 1];
            await conn.sendMessage(m.chat, {
                text: `📥 Download your APK here: [${selectedAPK.title}](${selectedAPK.link}\n\n©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍʀ ꜱᴇɴᴇꜱʜ )`,
                linkPreview: true,
            }, { quoted: userMsg });
        });

    } catch (error) {
        console.error("Error in APK plugin:", error); // Log error for debugging
        reply("❌ An error occurred while processing your request.");
    }
});