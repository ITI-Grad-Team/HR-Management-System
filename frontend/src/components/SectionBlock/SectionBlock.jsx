import React from "react";
import "./SectionBlock.css";
export default function SectionBlock({ children }) {
  return (
    <div>
      <div className="card-grid">{children}</div>
    </div>
  );
}
