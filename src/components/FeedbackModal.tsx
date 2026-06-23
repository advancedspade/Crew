'use client';

import { useState } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPES: { value: 'BUG' | 'FEATURE' | 'GENERAL'; label: string }[] = [
  { value: 'BUG', label: 'Bug' },
  { value: 'FEATURE', label: 'Feature' },
  { value: 'GENERAL', label: 'General' },
];

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [type, setType] = useState<'BUG' | 'FEATURE' | 'GENERAL'>('GENERAL');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setTimeout(handleClose, 1500);
      } else {
        setError(data.error || 'Failed to submit feedback');
      }
    } catch {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setType('GENERAL');
    setMessage('');
    setSubmitted(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative w-full max-w-md border-2 border-[var(--border)] bg-[var(--card-background)] p-6">
        {submitted ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <h3 className="font-mono text-sm uppercase tracking-wider">Thanks — logged.</h3>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between border-b-2 border-[var(--border)] pb-3">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider">Send Feedback</h3>
              <button
                onClick={handleClose}
                className="font-mono text-sm leading-none hover:opacity-60"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 border-2 border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
                  Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`border-2 border-[var(--border)] px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                        type === t.value
                          ? 'bg-[var(--foreground)] text-[var(--background)]'
                          : 'bg-[var(--card-background)] hover:bg-[var(--background)]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                  placeholder="What's on your mind?"
                  className="w-full border-2 border-[var(--border)] bg-[var(--card-background)] px-3 py-2 font-sans text-sm focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="border-2 border-[var(--border)] bg-[var(--foreground)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--background)] hover:opacity-80 disabled:opacity-40"
              >
                {isSubmitting ? 'Sending…' : 'Send'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

