import React, { Suspense } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const HrAdminUpperFallback = () => (
  <div className="p-4">


    {/* Cards Row */}
    <div className="d-flex gap-4 mb-4 flex-wrap">
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ flex: "1 1 200px" }}>
          <Skeleton height={100} width={250} />
        </div>
      ))}
    </div>

    <div className="mb-5 mt-3">
        <Skeleton height={300} width={"100%"} />
      </div>

  </div>
);

export default HrAdminUpperFallback;