import React, { useEffect, useState, useMemo } from "react";
import "./StudentManagement.css";

function Avatar({ name }) {
  const initials = (name || "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return <div className="sm-avatar" aria-hidden>{initials}</div>;
}

function Badge({ status }) {
  if (status === "Placed") return <span className="sm-badge placed">🟢 Placed</span>;
  if (status === "Interviewing") return <span className="sm-badge interviewing">🟡 Interviewing</span>;
  return <span className="sm-badge not-placed">🔴 Not Placed</span>;
}

export default function StudentManagement() {
  const [, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [resumeSummary, setResumeSummary] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const cRes = await fetch(`${`https://placement-tracker-backend.azurewebsites.net` || ""}/api/companies`);
        const companiesData = await cRes.json();
        if (!mounted) return;
        setCompanies(companiesData || []);

        // For each company, fetch passed students (those who cleared all rounds)
        const promises = (companiesData || []).map((c) =>
          fetch(`${`https://placement-tracker-backend.azurewebsites.net` || ""}/api/passedStudents/${encodeURIComponent(c.cname)}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => ({ company: c.cname, data }))
            .catch(() => ({ company: c.cname, data: [] }))
        );

        const results = await Promise.all(promises);
        if (!mounted) return;

        // aggregate unique students (keyed by srno)
        const map = new Map();
        results.forEach((res) => {
          (res.data || []).forEach((s) => {
            const key = s.srno || `${s.stname}-${s.branch}`;
            const existing = map.get(key) || { name: s.stname, reg: s.srno, branch: s.branch, placements: [] };
            existing.placements.push(res.company);
            map.set(key, existing);
          });
        });

        const list = Array.from(map.values()).map((s) => ({
          name: s.name,
          reg: s.reg,
          branch: s.branch,
          company: s.placements[0] || "",
          status: s.placements.length ? "Placed" : "Not Placed",
        }));

        setStudents(list);
      } catch (err) {
        console.error("Failed to load students", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => (mounted = false);
  }, []);

  const filtered = useMemo(() => {
    if (!query) return students;
    const q = query.toLowerCase();
    return students.filter((s) =>
      [s.name, s.reg, s.branch, s.company].some((v) => (v || "").toString().toLowerCase().includes(q))
    );
  }, [students, query]);

  // fetch resume summary when selected changes
  useEffect(() => {
    let mounted = true;
    async function fetchResume() {
      if (!selected || !selected.reg) {
        setResumeSummary(null);
        setResumeError('');
        setResumeLoading(false);
        return;
      }
      setResumeLoading(true);
      setResumeError('');
      try {
        const res = await fetch(`${`https://placement-tracker-backend.azurewebsites.net` || ''}/api/resume/${encodeURIComponent(selected.reg)}`);
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setResumeSummary(data.summary || null);
        } else if (res.status === 404) {
          setResumeSummary(null);
        } else {
          const d = await res.json().catch(() => ({}));
          setResumeError(d.message || 'Failed to fetch summary');
        }
      } catch (err) {
        if (!mounted) return;
        setResumeError('Network error while fetching summary');
      } finally {
        if (mounted) setResumeLoading(false);
      }
    }
    fetchResume();
    return () => { mounted = false; };
  }, [selected]);

  return (
    <div className="sm-page">
      <div className="sm-header">
        <h2>Student Management</h2>
        <div className="sm-controls">
          <input
            className="sm-search"
            placeholder="Search students by name, reg no., branch or company"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search students"
          />
        </div>
      </div>

      <div className="sm-table-wrap">
        {loading ? (
          <div className="sm-loading">Loading students…</div>
        ) : filtered.length === 0 ? (
          <div className="sm-empty">No students found.</div>
        ) : (
          <table className="sm-table" role="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Reg No.</th>
                <th>Branch</th>
                <th>Company</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => (
                <tr key={`${s.reg}-${idx}`} className="sm-row" onClick={() => setSelected(s)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setSelected(s); }}>
                  <td className="sm-col-student">
                    <Avatar name={s.name} />
                    <div className="sm-name">
                      <div className="sm-name-main">{s.name}</div>
                    </div>
                  </td>
                  <td>{s.reg || "—"}</td>
                  <td>{s.branch || "—"}</td>
                  <td>{s.company || "—"}</td>
                  <td><Badge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="sm-modal" role="dialog" aria-modal="true">
          <div className="sm-modal-content">
            <button className="sm-modal-close" onClick={() => setSelected(null)} aria-label="Close details">✕</button>
            <div className="sm-modal-body">
              <div className="sm-modal-left">
                <Avatar name={selected.name} />
              </div>
              <div className="sm-modal-right">
                <h3>{selected.name}</h3>
                <p><strong>Reg No:</strong> {selected.reg || "—"}</p>
                <p><strong>Branch:</strong> {selected.branch || "—"}</p>
                <p><strong>Company:</strong> {selected.company || "—"}</p>
                <p><strong>Status:</strong> <Badge status={selected.status} /></p>

                <section className="sm-resume-summary">
                  <h4>Resume Summary</h4>
                  {resumeLoading ? (
                    <p>Loading summary…</p>
                  ) : resumeError ? (
                    <p className="sm-error">{resumeError}</p>
                  ) : resumeSummary ? (
                    <p className="sm-summary-text">{resumeSummary}</p>
                  ) : (
                    <p className="sm-muted">No summary available for this student.</p>
                  )}
                </section>
                <div className="sm-modal-actions">
                  {/* Allow client-side toggle for Interviewing/Not Placed for convenience */}
                  <button className="sm-btn" onClick={() => setStudents((prev) => prev.map((p) => p.reg === selected.reg ? { ...p, status: 'Interviewing' } : p))}>Mark Interviewing</button>
                  <button className="sm-btn sm-btn-muted" onClick={() => setStudents((prev) => prev.map((p) => p.reg === selected.reg ? { ...p, status: 'Not Placed' } : p))}>Mark Not Placed</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


