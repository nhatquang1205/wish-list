import nodemailer, { type Transporter } from "nodemailer";
import type { Wish } from "./types";
import { publicImageUrl } from "./storage";

/**
 * Email notifications for wish approvals. Sends from Gmail to a configured
 * recipient. Gracefully degrades if env vars aren't set — the app works fine
 * without email, and failures are logged but never thrown.
 */

type EmailConfig = {
  user: string;
  pass: string;
  recipient: string;
};

/**
 * A blank line in .env (`GMAIL_USER=`) reads back as "" rather than undefined,
 * which would slip past `??` and configure an empty value. Treat it as unset.
 */
function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function config(): EmailConfig | null {
  const user = env("GMAIL_USER");
  const pass = env("GMAIL_APP_PASSWORD");
  const recipient = env("NOTIFICATION_EMAIL");

  if (!user || !pass || !recipient) return null;

  return { user, pass, recipient };
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const cfg = config();
  if (!cfg) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: cfg.user,
        pass: cfg.pass,
      },
    });
  }

  return transporter;
}

function buildApprovalEmailHtml(wish: Wish): string {
  const stars = wish.rating ? "★".repeat(wish.rating) + "☆".repeat(5 - wish.rating) : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .field {
      margin-bottom: 20px;
    }
    .label {
      font-weight: 600;
      color: #374151;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .value {
      color: #1f2937;
      font-size: 16px;
    }
    .wish-title {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 20px;
    }
    .wish-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 15px 0;
    }
    .rating {
      color: #f59e0b;
      font-size: 24px;
      letter-spacing: 2px;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    .tag {
      display: inline-block;
      background-color: #e5e7eb;
      color: #374151;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 500;
    }
    .admin-note {
      background-color: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 15px;
      border-radius: 4px;
      margin-top: 10px;
      font-style: italic;
    }
    .link {
      color: #2563eb;
      text-decoration: none;
      word-break: break-all;
    }
    .link:hover {
      text-decoration: underline;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Wish Approved!</h1>
    </div>

    <div class="content">
      <div class="wish-title">${escapeHtml(wish.title)}</div>

      ${
        wish.url
          ? `
      <div class="field">
        <div class="label">Link</div>
        <div class="value">
          <a href="${escapeHtml(wish.url)}" class="link" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(wish.url)}
          </a>
        </div>
      </div>
      `
          : ""
      }

      ${
        wish.imageUrl
          ? `
      <div class="field">
        <div class="label">Photo</div>
        <img src="${escapeHtml(wish.imageUrl)}" alt="${escapeHtml(wish.title)}" class="wish-image" />
      </div>
      `
          : ""
      }

      ${
        wish.note
          ? `
      <div class="field">
        <div class="label">Note</div>
        <div class="value">${escapeHtml(wish.note)}</div>
      </div>
      `
          : ""
      }

      ${
        wish.rating
          ? `
      <div class="field">
        <div class="label">Rating</div>
        <div class="rating">${stars}</div>
      </div>
      `
          : ""
      }

      ${
        wish.tags && wish.tags.length > 0
          ? `
      <div class="field">
        <div class="label">Tags</div>
        <div class="tags">
          ${wish.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      </div>
      `
          : ""
      }

      ${
        wish.adminNote
          ? `
      <div class="field">
        <div class="label">Admin Note</div>
        <div class="admin-note">${escapeHtml(wish.adminNote)}</div>
      </div>
      `
          : ""
      }
    </div>

    <div class="footer">
      Wish approved at ${new Date(wish.updatedAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })}
    </div>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

export async function sendApprovalEmail(wish: Wish): Promise<boolean> {
  const cfg = config();
  const transport = getTransporter();

  if (!cfg || !transport) {
    // Silently skip if email not configured
    if (process.env.NODE_ENV === "development") {
      console.log("📧 Email not configured. Would send approval email for:", wish.title);
    }
    return false;
  }

  try {
    await transport.sendMail({
      from: `"Wish List" <${cfg.user}>`,
      to: cfg.recipient,
      subject: `Wish Approved: ${wish.title}`,
      html: buildApprovalEmailHtml(wish),
    });

    console.log("✓ Sent approval email for:", wish.title);
    return true;
  } catch (error) {
    console.error("Failed to send approval email:", error);
    return false;
  }
}
