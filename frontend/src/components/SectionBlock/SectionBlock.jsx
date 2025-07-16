import React from "react";
import "./SectionBlock.css"; 
export default function SectionBlock({ title, extraHeader, children }) {
  return (
    <div className="section">
      <div className="section-heading">
        <h2>{title}</h2>
        {extraHeader && <div className="section-filters">{extraHeader}</div>}
      </div>
      <div className="card-grid">{children}</div>
    </div>
  );
}