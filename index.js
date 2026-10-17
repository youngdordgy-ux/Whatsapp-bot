const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const P = require("pino");
const qrcode = require("qrcode-terminal");
const fs = require("fs");

const PREFIX = process.env.PREFIX || ".";
const BOT_NAME = process.env.BOT_NAME || "CASSIUS";
const OWNER_NAME = process.env.OWNER_NAME || "FORTEX TECH";

const menuText = () => `🌍━━━❖━━━🌍
┃  ${BOT_NAME} • MAIN MENU
🌍━━━❖━━━🌍

╭━━━〔 BOT INFO 〕━━━╮
┃ OWNER  - ${OWNER_NAME}
┃ VERSION - 1.0.0
┃ PREFIX - [ ${PREFIX} ]
┃ STATUS  - ONLINE
╰━━━━━━━━━━━━━━━━━━╯

╭━━━〔 REPLY NUMBER ⬇️ 〕━━━╮
┃ 1️⃣ OWNER MENU
┃ 2️⃣ SOCIAL MENU
┃ 3️⃣ AI MENU
┃ 4️⃣ GROUP MENU
┃ 5️⃣ TOOLS MENU
┃ 6️⃣ EDUCATION MENU
┃ 7️⃣ CHANNEL MENU
╰━━━━━━━━━━━━━━━━━━━━━━╯

_Reply with a number or type ${PREFIX}help_`;

const menus = {
  "1": `👑 *OWNER MENU*\n\n${PREFIX}ping - Check bot\n${PREFIX}owner - Owner information\n${PREFIX}status - Bot status`,
  "2": `📱 *SOCIAL MENU*\n\n${PREFIX}channel - Channel information\n${PREFIX}social - Social links`,
  "3": `🤖 *AI MENU*\n\n${PREFIX}ai <question> - AI assistant\n\nAI integration can be connected through your preferred AI provider.`,
  "4": `👥 *GROUP MENU*\n\n${PREFIX}groupinfo - Group information\n${PREFIX}rules - Show group rules\n${PREFIX}tagall - Tag members (admin use only)`,
  "5": `🛠️ *TOOLS MENU*\n\n${PREFIX}sticker - Create sticker from supported media\n${PREFIX}short - URL shortener\n${PREFIX}calc - Calculator`,
  "6": `📚 *EDUCATION MENU*\n\n${PREFIX}study - Study tips\n${PREFIX}quiz - Quick quiz\n${PREFIX}topics - Learning topics`,
  "7": `📢 *CHANNEL MENU*\n\n${PREFIX}channel - Channel information\n${PREFIX}news - Channel news`
};

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["CASSIUS", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("\nScan this QR code with WhatsApp > Linked devices:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("✅ CASSIUS WhatsApp bot is online.");
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log("Connection closed.", shouldReconnect ? "Reconnecting..." : "Logged out.");
      if (shouldReconnect) setTimeout(startBot, 3000);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      "";

    const body = text.trim();
    if (!body) return;

    // Number replies can open menu sections.
    if (menus[body]) {
      await sock.sendMessage(jid, { text: menus[body] });
      return;
    }

    if (!body.startsWith(PREFIX)) return;

    const args = body.slice(PREFIX.length).trim().split(/\s+/);
    const command = (args.shift() || "").toLowerCase();

    try {
      switch (command) {
        case "menu":
        case "help":
          await sock.sendMessage(jid, {
            text: menuText(),
            contextInfo: {
              externalAdReply: {
                title: BOT_NAME,
                body: "WhatsApp Assistant",
                mediaType: 1
              }
            }
          });
          break;

        case "ping":
          await sock.sendMessage(jid, { text: "🏓 Pong! Bot is online." });
          break;

        case "owner":
          await sock.sendMessage(jid, {
            text: `👑 *OWNER*\n\n${OWNER_NAME}\nBot: ${BOT_NAME}`
          });
          break;

        case "status":
          await sock.sendMessage(jid, {
            text: "🟢 *STATUS*\n\nCASSIUS is online and ready."
          });
          break;

        case "social":
          await sock.sendMessage(jid, {
            text: "📱 *SOCIAL MENU*\n\nAdd your official social links here."
          });
          break;

        case "channel":
          await sock.sendMessage(jid, {
            text: "📢 *CHANNEL*\n\nAdd your official WhatsApp Channel link here."
          });
          break;

        case "ai":
          await sock.sendMessage(jid, {
            text: args.length
              ? `🤖 AI request received:\n\n${args.join(" ")}\n\nConnect an AI provider in the next step to return real answers.`
              : `Use: ${PREFIX}ai your question`
          });
          break;

        case "study":
          await sock.sendMessage(jid, {
            text: "📚 Study tip: break your work into small topics, practice actively, and review mistakes."
          });
          break;

        case "quiz":
          await sock.sendMessage(jid, {
            text: "🧠 *QUIZ*\n\nWhat is the capital of South Africa?\n\nA) Cape Town\nB) Pretoria\nC) Durban\nD) Bloemfontein"
          });
          break;

        case "topics":
          await sock.sendMessage(jid, {
            text: "📖 Topics: Mathematics • Science • Computing • History • Geography • Languages"
          });
          break;

        case "calc": {
          const expression = args.join(" ");
          if (!expression) {
            await sock.sendMessage(jid, { text: `Use: ${PREFIX}calc 12*8` });
            break;
          }
          // Intentionally allow only basic calculator characters.
          if (!/^[0-9+*\/().%\s-]+$/.test(expression)) {
            await sock.sendMessage(jid, { text: "❌ Only basic calculator expressions are allowed." });
            break;
          }
          const result = Function(`"use strict"; return (${expression})`)();
          await sock.sendMessage(jid, { text: `🧮 ${expression} = ${result}` });
          break;
        }

        default:
          await sock.sendMessage(jid, {
            text: `❌ Unknown command.\nType ${PREFIX}menu to open the main menu.`
          });
      }
    } catch (err) {
      console.error(err);
      await sock.sendMessage(jid, { text: "⚠️ Something went wrong while processing that command." });
    }
  });
}

startBot().catch(console.error);
