import React from 'react';
import './Skeleton.css';

export function SkeletonCard({width='100%', height=24, style={}}){
  return <div className="skeleton card-skeleton" style={{width, height, ...style}} />;
}

export function SkeletonBlock({lines=4}){
  return (
    <div>
      {Array.from({length: lines}).map((_,i)=> (
        <div key={i} style={{marginBottom:10}}>
          <div className="skeleton" style={{height: 12, width: `${90 - i*10}%`}} />
        </div>
      ))}
    </div>
  );
}

export default SkeletonCard;
