# CASSIUS WhatsApp Bot

This is a starter WhatsApp bot built around the same idea as the supplied screenshot:
- styled main menu
- numbered menu navigation
- owner/social/AI/group/tools/education/channel sections
- configurable bot name, owner name and prefix
- QR-based WhatsApp Web login
- persistent authentication in `auth_info/`

## Requirements
- Node.js 18+
- A WhatsApp account you are allowed to automate
- Internet connection

## Install

```bash
npm install
```

Copy `.env.example` to `.env` if you want custom settings.

## Run

```bash
npm start
```

A QR code will appear in the terminal. In WhatsApp, open Linked devices and scan it.

Then send:

```text
.menu
```

Reply with `1`, `2`, `3`, etc. to open sections.

## Important
This starter uses Baileys, which connects through WhatsApp Web rather than the official WhatsApp Cloud API. For a business/production deployment, consider the official WhatsApp Business Platform and comply with WhatsApp's policies.

Do not use the bot to distribute copyrighted movies/music or other content without permission.
