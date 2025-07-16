import React from "react";
import { positions } from "../../lib/Positions";
import { regions } from "../../lib/Regions";
import "./Filters.css";

export default function Filters({
  positionSelect,
  regionSelect,
  isCoordinatorValue,
  onPositionChange,
  onRegionChange,
  onCoordinatorToggle,
  onClear,
}) {
  return (
    <div className="filters">
      <span>Filters:</span>

      <div className="filter-controls">
        <select value={positionSelect} onChange={onPositionChange}>
          <option value="">Position</option>
          {positions.map((pos) => (
            <option key={pos.id} value={pos.name}>
              {pos.name}
            </option>
          ))}
        </select>

        <select value={regionSelect} onChange={onRegionChange}>
          <option value="">Region</option>
          {regions.map((region) => (
            <option key={region.id} value={region.name}>
              {region.name}
            </option>
          ))}
        </select>

        {onCoordinatorToggle && (
          <div className="is-coordinator">
            <label htmlFor="coordinator">Is Coordinator</label>
            <input
              type="checkbox"
              id="coordinator"
              checked={isCoordinatorValue}
              onChange={onCoordinatorToggle}
            />
          </div>
        )}

        <button className="clear-btn" onClick={onClear}>
          Clear Filters
        </button>
      </div>
    </div>
  );
}
