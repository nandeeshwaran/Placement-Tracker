import React, { useEffect, useState } from 'react';
import { useAuth } from './auth/AuthContext';

export default function SummaryDashboard() {
  const auth = useAuth();
  const isStudent = auth.role === 'student';
  const srno = auth.user?.username || auth.user?.srno || '';

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isStudent || !srno) {
      setLoading(false);
      return;
    }

    let mounted = true;
    async function fetchSummary() {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/resume/${encodeURIComponent(srno)}`);
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setSummary(data.summary || null);
        } else if (res.status === 404) {
          setSummary(null);
        } else {
          const d = await res.json().catch(() => ({}));
          setError(d.message || 'Failed to fetch resume summary');
        }
      } catch (err) {
        setError('Network error while fetching summary');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchSummary();
    return () => (mounted = false);
  }, [isStudent, srno]);

  if (!isStudent) return <div className="summary-page"><h2>Not available</h2><p>This page is only available to students.</p></div>;

  const handleChoose = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  async function upload(useReupload = false) {
    if (!file) {
      setError('Please select a PDF file to upload');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const url = `${process.env.REACT_APP_API_URL || ''}/api/resume/${useReupload ? 'reupload' : 'upload'}/${encodeURIComponent(srno)}`;
      const method = useReupload ? 'PUT' : 'POST';
      const res = await fetch(url, { method, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setSummary(data.summary || null);
      setFile(null);
    } catch (err) {
      setError(err.message || 'Failed to upload');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[60vh] max-w-4xl mx-auto my-8 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">My Resume Summary</h2>

        {loading ? (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Loading…</p>
        ) : (
          <>
            {summary ? (
              <div className="mt-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg p-5">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Your current summary</h3>
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">{summary}</p>

                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                    <span className="inline-block px-3 py-2 bg-white dark:bg-slate-700 border rounded-md">Choose PDF</span>
                    <input className="hidden" type="file" accept="application/pdf" onChange={handleChoose} />
                  </label>

                  <button onClick={() => upload(true)} disabled={submitting || !file} className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-60">
                    {submitting ? 'Uploading...' : 'Re-upload & Summarize'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg p-5">
                <p className="text-sm text-slate-700 dark:text-slate-200">You haven't uploaded a resume yet. Upload a PDF to get a concise AI-generated summary.</p>

                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                    <span className="inline-block px-3 py-2 bg-white dark:bg-slate-700 border rounded-md">Choose PDF</span>
                    <input className="hidden" type="file" accept="application/pdf" onChange={handleChoose} />
                  </label>

                  <button onClick={() => upload(false)} disabled={submitting || !file} className="px-4 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-60">
                    {submitting ? 'Uploading...' : 'Upload & Summarize'}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
