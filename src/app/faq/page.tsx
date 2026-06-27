'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import PageLoading from '@/components/PageLoading';

interface Faq {
  id: string;
  question: string;
  answer: string | null;
  publishedAt: string | null;
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchFaqs = useCallback(async () => {
    try {
      const res = await fetch('/api/faq');
      const data = await res.json();
      if (data.success) setFaqs(data.data);
    } catch (err) { console.error('Failed to fetch FAQs:', err); }
  }, []);

  useEffect(() => {
    fetchFaqs().finally(() => setIsLoading(false));
  }, [fetchFaqs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter((f) =>
      f.question.toLowerCase().includes(q) || (f.answer || '').toLowerCase().includes(q)
    );
  }, [faqs, query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) { setError('Question is required'); return; }
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setQuestion('');
        setSuccess('Question submitted — an admin will get back to you.');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.error || 'Failed to submit');
      }
    } catch (err) {
      setError('Failed to submit question');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <PageLoading />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 border-b border-[var(--border)] pb-4">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--foreground)]">FAQ</h2>
        <p className="mt-1 text-[11px] text-[var(--text-secondary)]">Search published answers — or ask something new</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search FAQs…"
          className="w-full border border-[var(--border)] bg-[var(--card-background)] px-3 py-2 text-sm"
          autoFocus
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="mb-10 border border-dashed border-[var(--border-light)] bg-[var(--card-background)] p-8 text-center">
          <p className="text-[11px] uppercase tracking-wider text-[var(--border-light)]">
            {query ? 'No matching FAQs' : 'No FAQs published yet'}
          </p>
        </div>
      ) : (
        <div className="mb-10 border border-[var(--border)] bg-[var(--card-background)]">
          {filtered.map((f, i) => {
            const isOpen = openId === f.id;
            return (
              <div key={f.id} className={i > 0 ? 'border-t border-[var(--border-light)]' : ''}>
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : f.id)}
                  className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left hover:bg-[var(--background)] transition-colors"
                >
                  <span className="text-sm font-black text-[var(--foreground)]">{f.question}</span>
                  <span className="font-mono text-[10px] text-[var(--text-secondary)] shrink-0 pt-0.5">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && f.answer && (
                  <div className="px-5 pb-4 text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{f.answer}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit form */}
      <form onSubmit={handleSubmit} className="border border-[var(--border)] bg-[var(--card-background)] p-6">
        <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Ask a question</h3>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="What would you like to know?"
          className="mb-3 w-full border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm resize-none"
        />
        {error && <p className="mb-3 text-xs text-red-700">{error}</p>}
        {success && <p className="mb-3 text-xs text-green-700">{success}</p>}
        <button type="submit" disabled={isSubmitting || !question.trim()}
          className="border border-[var(--border)] bg-[var(--foreground)] px-5 py-2 text-[11px] font-black uppercase tracking-wider text-[var(--background)] hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          {isSubmitting ? 'Submitting...' : 'Submit Question'}
        </button>
      </form>
    </div>
  );
}
