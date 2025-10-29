import React from 'react';
import { Link } from 'react-router-dom';
import './PlacementOverview.css';

export default function PlacementOverview() {
  return (
    <div className="placement-overview app-container">
      <h2>Placement Overview</h2>
      <p>This is a student-facing placement overview. Use the buttons below to explore placements and companies.</p>

      <div className="overview-cards">
        <Link className="card" to="/campus-selection">Choose Campus</Link>
        <Link className="card" to="/company-selection">Browse Companies</Link>
        <Link className="card" to="/students">My Applications</Link>
      </div>
    </div>
  );
}
