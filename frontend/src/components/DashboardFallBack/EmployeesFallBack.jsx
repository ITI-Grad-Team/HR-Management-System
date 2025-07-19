import React from 'react';
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const EmployeesFallBack = () => (
  <div className="p-4">
    

    {/* Cards Grid */}
    <div
      className="mb-5"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1rem",
      }}
    >
      {[...Array(8)].map((_, i) => (
        <div key={i}>
          <Skeleton height={190} width="100%" borderRadius={"15px"} />
        </div>
      ))}
    </div>

   
  </div>
);

export default EmployeesFallBack;
