import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import './DashboardViz.css';

const COLORS = ['#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

function DashboardViz({ companies = [] }) {
  // Prepare bar chart data: rounds per company
  const barData = companies.map((c) => ({
    name: c.cname || 'Unknown',
    rounds: c.trounds || c.rounds || 0,
  }));

  // For a simple pie chart, create a distribution of companies by the first letter group
  const pieMap = {};
  companies.forEach((c) => {
    const key = (c.cname || 'Unknown').charAt(0).toUpperCase();
    pieMap[key] = (pieMap[key] || 0) + 1;
  });
  const pieData = Object.keys(pieMap).slice(0, 6).map((k) => ({ name: k, value: pieMap[k] }));

  return (
    <div className="viz-root card">
      <h3 className="viz-title">Placements Overview</h3>
      <div className="viz-grid">
        <div className="viz-chart">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="rounds" name="Total Rounds" fill="#2563eb">
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="viz-chart small">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-pie-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="viz-note">Inspired by Superset: interactive, responsive summary cards and charts.</p>
    </div>
  );
}

export default DashboardViz;
