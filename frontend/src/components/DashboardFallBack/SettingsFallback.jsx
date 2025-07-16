import React, { Suspense } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const SettingsFallback = () => (
  <div className="p-1">


    {/* Cards Row */}
    <div className="d-flex gap-4 mb-4 flex-wrap">
      {[...Array(5)].map((_, i) => (
        <div key={i}>
          <Skeleton height={400} width={350} />
        </div>
      ))}
    </div>

  </div>
);

export default SettingsFallback;