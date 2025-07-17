import React from 'react';
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const EmployeesFallBack = () => (
  <div className="p-4">
    
    <div className="mb-4">
      <Skeleton height={80} width="100%" borderRadius={"15px"} />
    </div>

    {/* Filters */}
    <div className="d-flex gap-2 mb-4 flex-wrap">
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ flex: "1 1 200px" }}>
          <Skeleton height={30} width={230} borderRadius={"15px"} />
        </div>
      ))}
    </div>

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

    {/* Pagination Dots */}
    <div className="d-flex mb-2 justify-content-center">
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ marginRight: "30px" }}>
          <Skeleton height={6} width={6} borderRadius={"50%"} />
        </div>
      ))}
    </div>

    {/* Another Section Header */}
    <div className="mb-4 mt-5">
      <Skeleton height={80} width="100%" borderRadius={"15px"} />
    </div>

    {/* Another Filters */}
    <div className="d-flex gap-2 mb-4 flex-wrap">
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ flex: "1 1 200px" }}>
          <Skeleton height={30} width={230} borderRadius={"15px"} />
        </div>
      ))}
    </div>

    {/* Second Cards Grid */}
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
          <Skeleton height={190} width="100%" borderRadius={"15px"} />
        </div>
      ))}
    </div>

    {/* Second Pagination Dots */}
    <div className="d-flex mb-2 justify-content-center">
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ marginRight: "30px" }}>
          <Skeleton height={6} width={6} borderRadius={"50%"} />
        </div>
      ))}
    </div>
  </div>
);

export default EmployeesFallBack;
