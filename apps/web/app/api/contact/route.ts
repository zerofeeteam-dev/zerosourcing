import { NextResponse } from "next/server";

const contactMethods = new Set(["카카오톡·문자", "이메일", "전화"]);

type ContactMessage = {
  budget: string;
  company: string;
  contactMethod: string;
  email: string;
  message: string;
  name: string;
  phone: string;
};

type SlackResponse = {
  error?: string;
  ok?: boolean;
};

function getString(data: Record<string, unknown>, key: string, maxLength = 300) {
  const value = data[key];
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeSlackText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatBudget(value: string) {
  return /원|만원|만\s*원/.test(value) ? value : `${value}만 원`;
}

function formatContactMethod(value: string) {
  return value.replace("·", " / ");
}

function quoteMessage(value: string) {
  const text = value ? escapeSlackText(value) : "추가 내용 없음";
  return text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSlackResponse(value: unknown): value is SlackResponse {
  return isRecord(value);
}

function parseContactMessage(data: Record<string, unknown>) {
  const contact = {
    budget: getString(data, "budget"),
    company: getString(data, "company"),
    contactMethod: getString(data, "contactMethod"),
    email: getString(data, "email"),
    message: getString(data, "message", 1800),
    name: getString(data, "name"),
    phone: getString(data, "phone"),
  } satisfies ContactMessage;

  if (
    !contact.company ||
    !contact.name ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) ||
    !contact.phone ||
    !contactMethods.has(contact.contactMethod) ||
    !contact.budget ||
    data.privacyConsent !== true
  ) {
    return null;
  }

  return contact;
}

function buildSlackBlocks(contact: ContactMessage) {
  const fields = [
    `• 기업명: ${escapeSlackText(contact.company)}`,
    `• 담당자 성함: ${escapeSlackText(contact.name)}`,
    `• 이메일: ${escapeSlackText(contact.email)}`,
    `• 연락처: ${escapeSlackText(contact.phone)}`,
    `• 연락 방법: ${escapeSlackText(formatContactMethod(contact.contactMethod))}`,
    `• 예산: ${escapeSlackText(formatBudget(contact.budget))}`,
  ].join("\n");

  return [
    {
      text: {
        text: "🤖 *제로소싱 외주 문의 접수*",
        type: "mrkdwn",
      },
      type: "section",
    },
    {
      text: {
        text: fields,
        type: "mrkdwn",
      },
      type: "section",
    },
    {
      text: {
        text: quoteMessage(contact.message),
        type: "mrkdwn",
      },
      type: "section",
    },
  ];
}

export async function POST(request: Request) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID;

  if (!token || !channel) {
    return NextResponse.json({ error: "slack_env_missing" }, { status: 500 });
  }

  const body: unknown = await request.json().catch(() => null);

  if (!isRecord(body)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const contact = parseContactMessage(body);

  if (!contact) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const slackResponse = await fetch("https://slack.com/api/chat.postMessage", {
    body: JSON.stringify({
      blocks: buildSlackBlocks(contact),
      channel,
      text: `제로소싱 외주 문의 접수 - ${escapeSlackText(contact.company)}`,
      unfurl_links: false,
      unfurl_media: false,
    }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    method: "POST",
  });
  const slackResult: unknown = await slackResponse.json().catch(() => null);

  if (!slackResponse.ok || !isSlackResponse(slackResult) || !slackResult.ok) {
    console.error("Slack contact notification failed", {
      error: isSlackResponse(slackResult) ? slackResult.error : "invalid_response",
      status: slackResponse.status,
    });

    return NextResponse.json({ error: "slack_send_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
