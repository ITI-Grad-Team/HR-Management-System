import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const HrAdminUpperFallback = () => (
  <div className="p-4">
    {/* Cards */}
    <div
      className="mb-4"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1rem",
      }}
    >
      {[...Array(8)].map((_, i) => (
        <div key={i}>
          <Skeleton height={100} width="100%" />
        </div>
      ))}
    </div>

    {/* Chart */}
    <div className="mb-5 mt-3">
      <Skeleton height={300} width="100%" />
    </div>
  </div>
);

export default HrAdminUpperFallback;
