import React from 'react'
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const PayrolFallback = () => {
  return (
    <div className="p-4">
      {/* Page Title & Button */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2><Skeleton width={250} /></h2>
        <Skeleton width={150} height={40} />
      </div>

      {/* Filters Row */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} height={38} width={140} />
        ))}
        <Skeleton width={160} height={38} />
      </div>

      {/* Stats Boxes */}
      <div className="d-flex flex-wrap gap-3 mb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-grow-1" style={{ minWidth: 150 }}>
            <Skeleton height={80} />
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="d-flex flex-wrap gap-4 mb-4">
        {/* Pie Chart */}
        <div className="flex-grow-1" style={{ minWidth: 400 }}>
          <Skeleton height={300} />
        </div>

        {/* Bar + Line Charts */}
        <div className="d-flex flex-column gap-3 flex-grow-1" style={{ minWidth: 400 }}>
          <Skeleton height={140} />
          <Skeleton height={140} />
        </div>
      </div>

      {/* Table Filters */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <Skeleton width={200} height={38} />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} height={38} width={120} />
        ))}
        <Skeleton height={38} width={160} />
      </div>

      {/* Table Header */}
      <Skeleton height={40} />

      {/* Table Rows */}
      {[...Array(7)].map((_, i) => (
        <div key={i} className="mt-2"><Skeleton height={35} /></div>
      ))}

      {/* Pagination */}
      <div className="d-flex justify-content-center mt-4">
        <Skeleton width={60} height={35} />
      </div>
    </div>
  )
}

export default PayrolFallback