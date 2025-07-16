import React, { Suspense } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const DashboardFallback = () => (
  <div className="p-4">
    {/* Title */}
    <div className="mb-4">
      <Skeleton height={30} width={250} />
    </div>

    {/* Cards Row */}
    <div className="d-flex gap-4 mb-4 flex-wrap">
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ flex: "1 1 200px" }}>
          <Skeleton height={100} />
        </div>
      ))}
    </div>

    {/* Table Placeholder */}
    <div>
      <Skeleton height={20} width="100%" className="mb-2" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} height={40} width="100%" className="mb-2" />
      ))}
    </div>
  </div>
);

export default DashboardFallback;