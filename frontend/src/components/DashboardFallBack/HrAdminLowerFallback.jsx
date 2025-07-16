import React, { Suspense } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const HrAdminLowerFallback = () => (
  <div className="p-4 mt-4">

    <div>
      <Skeleton height={20} width="100%" className="mb-2" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} height={40} width="100%" className="mb-2" />
      ))}
    </div>
  </div>
);

export default HrAdminLowerFallback;