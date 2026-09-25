'use client';

import { useState } from 'react';
import { site } from '@/lib/site';

const TOPICS = [
  'Question before ordering',
  'Existing order or delivery',
  'Return or refund',
  'Authenticity or damaged box',
  'Sealed case or bulk enquiry',
  'Something else',
];

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [values, setValues] = useState({
    name: '',
    email: '',
    order: '',
    topic: TOPICS[0],
    message: '',
  });

  /**
   * No inbox is wired up yet, so the form composes a pre-filled mailto rather
   * than silently dropping the message. Swap this for a POST to your own
   * handler (or a form service) once one exists.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `${values.topic}${values.order ? ` — order ${values.order}` : ''}`;
    const body = [
      `Name: ${values.name}`,
      `Email: ${values.email}`,
      values.order ? `Order number: ${values.order}` : null,
      `Topic: ${values.topic}`,
      '',
      values.message,
    ]
      .filter(Boolean)
      .join('\n');

    window.location.href = `mailto:${site.contact.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-card sm:p-8">
      <h2 className="font-display text-[24px] tracking-tight">Send us a message</h2>
      <p className="mt-1.5 text-[14px] text-ink-soft">{site.contact.responseTime}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-[13.5px] font-semibold">
            Your name
          </label>
          <input id="name" name="name" required value={values.name} onChange={set('name')} className="field" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13.5px] font-semibold">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={values.email}
            onChange={set('email')}
            className="field"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="order" className="mb-1.5 block text-[13.5px] font-semibold">
            Order number <span className="font-normal text-ink-muted">(optional)</span>
          </label>
          <input id="order" name="order" value={values.order} onChange={set('order')} className="field" />
        </div>
        <div>
          <label htmlFor="topic" className="mb-1.5 block text-[13.5px] font-semibold">
            What is it about?
          </label>
          <select id="topic" name="topic" value={values.topic} onChange={set('topic')} className="field">
            {TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="message" className="mb-1.5 block text-[13.5px] font-semibold">
          How can we help?
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          value={values.message}
          onChange={set('message')}
          className="field resize-y"
          placeholder="Tell us what you need. If it is about a delivery or a fault, include your order number and anything you can see."
        />
      </div>

      <button type="submit" className="btn-primary mt-5 w-full py-3.5 sm:w-auto sm:px-8">
        Send message
      </button>

      {sent && (
        <p role="status" className="mt-4 rounded-lg bg-moss-50 px-4 py-3 text-[13.5px] text-moss-800">
          Your email client should have opened with the message ready to send. If it did not,
          email us directly at{' '}
          <a href={`mailto:${site.contact.email}`} className="font-semibold underline underline-offset-2">
            {site.contact.email}
          </a>
          .
        </p>
      )}

      <p className="mt-4 text-[12.5px] leading-relaxed text-ink-muted">
        We use the details you provide here only to answer your enquiry. See our Privacy
        Policy for how we handle personal information.
      </p>
    </form>
  );
}
