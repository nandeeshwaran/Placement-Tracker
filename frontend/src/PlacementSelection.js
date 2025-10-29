import React from "react";

const PlacementSelection = () => {
  return (
    <div className="app-container" style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:'60vh'}}>
      <div className="card" style={{width: '360px', textAlign:'center'}}>
        <h2 className="hero-title">Choose Placement Type</h2>
        <button
          className="btn btn-primary"
          style={{width: '100%', padding: '12px', marginTop: '12px'}}
          onClick={() => window.location.href = "/oncampus"}
          aria-label="Choose on-campus placement"
        >
          On-Campus
        </button>
        <button
          className="btn btn-primary"
          style={{width: '100%', padding: '12px', marginTop: '8px'}}
          onClick={() => window.location.href = "/offcampus"}
          aria-label="Choose off-campus placement"
        >
          Off-Campus
        </button>
      </div>
    </div>
  );
};

export default PlacementSelection;