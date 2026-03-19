/**
 * Mission Chat — ask questions about Mars rovers and missions.
 * Uses the Anthropic Claude API with Mars mission context.
 */
import { ROVERS, ROVER_NAMES } from "../config.ts";
import { getAnthropicKey } from "./ai-narrator.ts";
import { getAnimationState } from "./traverse/traverse-animation.ts";
import { getCurrentSol } from "../utils/sol-date.ts";
// Types used transitively via config imports

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const chatHistory: ChatMessage[] = [];

const SYSTEM_PROMPT = `You are SolTracker's Mars mission assistant. You have deep knowledge of all four NASA Mars rovers:

- Perseverance (Mars 2020): Active since Feb 2021, Jezero Crater. Searching for signs of ancient microbial life. Has Ingenuity helicopter companion. Collecting sample tubes for future return to Earth.
- Curiosity (MSL): Active since Aug 2012, Gale Crater. Studying habitability, climbing Mount Sharp. Has REMS weather station.
- Opportunity (MER-B): Landed Jan 2004, Meridiani Planum. Marathon-distance rover (45.16 km). Lost in 2018 dust storm after 5,111 sols.
- Spirit (MER-A): Landed Jan 2004, Gusev Crater. Explored Columbia Hills, got stuck at Troy sol 1892. Last contact sol 2210.

You also know about Mars geology, atmosphere, seasons, and exploration history. Keep answers concise (2-4 sentences) and engaging. If asked about current status, note which rovers are still active.`;

/**
 * Initialize the mission chat interface.
 */
export function initMissionChat(): void {
  const input = document.getElementById("chat-input") as HTMLInputElement | null;
  const sendBtn = document.getElementById("chat-send");
  const messagesEl = document.getElementById("chat-messages");

  if (!input || !sendBtn || !messagesEl) return;

  // Send on button click
  sendBtn.addEventListener("click", () => submitMessage(input, messagesEl));

  // Send on Enter key
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage(input, messagesEl);
    }
  });
}

/** Submit a user message and get AI response. */
async function submitMessage(input: HTMLInputElement, messagesEl: HTMLElement): Promise<void> {
  const text = input.value.trim();
  if (!text) return;

  const key = getAnthropicKey();
  if (!key) {
    appendMessage(messagesEl, "assistant", "Chat requires an Anthropic API key. Set one in Settings.");
    return;
  }

  // Add user message
  chatHistory.push({ role: "user", content: text });
  appendMessage(messagesEl, "user", text);
  input.value = "";

  // Add context about current state
  const state = getAnimationState();
  const config = ROVERS[state.activeRover];
  const currentContext = `[Context: User is viewing ${config.displayName} at Sol ${state.currentSol}. Current real sols: ${ROVER_NAMES.filter((r) => ROVERS[r].status === "active").map((r) => `${ROVERS[r].displayName} Sol ${getCurrentSol(r)}`).join(", ")}]`;

  // Show typing indicator
  const typingId = appendMessage(messagesEl, "assistant", "...");

  try {
    const response = await callClaude(key, currentContext, text);
    chatHistory.push({ role: "assistant", content: response });

    // Replace typing indicator
    const typingEl = messagesEl.querySelector(`[data-msg-id="${typingId}"]`);
    if (typingEl) {
      typingEl.querySelector(".chat-text")!.textContent = response;
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Failed to get response";
    const typingEl = messagesEl.querySelector(`[data-msg-id="${typingId}"]`);
    if (typingEl) {
      typingEl.querySelector(".chat-text")!.textContent = errMsg;
      typingEl.classList.add("chat-error");
    }
  }
}

/** Call the Claude API. */
async function callClaude(apiKey: string, context: string, userMessage: string): Promise<string> {
  const messages = [
    ...chatHistory.slice(-8), // Keep last 8 messages for context
    { role: "user" as const, content: `${context}\n\n${userMessage}` },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("Invalid API key");
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text ?? "No response.";
  } finally {
    clearTimeout(timeout);
  }
}

/** Append a message to the chat display. Returns a unique ID. */
let msgCounter = 0;
function appendMessage(container: HTMLElement, role: "user" | "assistant", text: string): string {
  const id = `msg-${++msgCounter}`;
  const div = document.createElement("div");
  div.className = `chat-msg chat-${role}`;
  div.setAttribute("data-msg-id", id);
  div.innerHTML = `
    <span class="chat-role">${role === "user" ? "You" : "SolTracker"}</span>
    <span class="chat-text">${text}</span>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}
