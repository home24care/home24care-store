/**
 * Live chat model.
 *
 * A conversation is identified by a random id the visitor's browser keeps in
 * localStorage. There is no account and no login: the id IS the credential,
 * which is why it is 32 hex characters and why the send/poll routes accept it
 * without further proof. Anyone holding it can read that one conversation and
 * nothing else.
 *
 * Visitor-supplied name and email are optional and stored as given. They are
 * the only personal data in the system, and the privacy policy has to say so.
 */

export type ChatAuthor = 'visitor' | 'agent';

export type ChatMessage = {
  id: string;
  from: ChatAuthor;
  text: string;
  /** Server-assigned epoch ms. Never taken from the client. */
  ts: number;
};

export type ChatConversation = {
  id: string;
  createdAt: number;
  lastAt: number;
  /** Last message text, truncated, for the admin list. */
  preview: string;
  lastFrom: ChatAuthor;
  /** Messages the agent has not read yet. */
  unread: number;
  name: string | null;
  email: string | null;
  /** Where the visitor was when they opened the chat. */
  path: string | null;
  country: string | null;
  device: string | null;
};

/** What the visitor's widget polls for. */
export type VisitorPoll = {
  messages: ChatMessage[];
  /** Cursor to send back next time. */
  cursor: number;
  /** True while the store is unavailable, so the widget can say so honestly. */
  degraded?: boolean;
};

/** What the admin console polls for. */
export type AdminPoll = {
  conversations: ChatConversation[];
  totalUnread: number;
  cursor: number;
  storage: 'redis' | 'memory';
};

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_MESSAGES_PER_CONVERSATION = 400;
/** Conversations expire after 30 days of silence. */
export const CONVERSATION_TTL_SECONDS = 60 * 60 * 24 * 30;
