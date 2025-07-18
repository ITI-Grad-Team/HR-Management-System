import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const AdminAttendanceFallback = () => {
  return (
    <div className="p-4">
      {/* Page Title */}
      <h2 className="mb-4"><Skeleton width={220} /></h2>

      {/* Top Sections: Pending Requests & Recent Decisions */}
      <div className="d-flex flex-wrap gap-4 mb-4">
        {/* Pending Overtime Requests */}
        <div className="flex-grow-1 p-3 bg-white shadow-sm rounded-3" style={{ minWidth: 400 }}>
          <h5 className="mb-3"><Skeleton width={220} /></h5>
          <Skeleton height={40} />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mt-2"><Skeleton height={35} /></div>
          ))}
        </div>

        {/* Recent Overtime Decisions */}
        <div className="flex-grow-1 p-3 bg-white shadow-sm rounded-3" style={{ minWidth: 400 }}>
          <h5 className="mb-3"><Skeleton width={260} /></h5>
          <Skeleton height={40} />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="mt-2"><Skeleton height={35} /></div>
          ))}
        </div>
      </div>

      {/* All Attendance Records */}
      <div className="bg-white shadow-sm rounded-3 p-3">
        <h5 className="mb-3"><Skeleton width={200} /></h5>

        {/* Filter Bar */}
        <div className="d-flex gap-2 mb-3 flex-wrap">
          <Skeleton height={38} width={240} />
          <Skeleton height={38} width={140} />
          <Skeleton height={38} width={80} />
          <Skeleton height={38} width={80} />
        </div>

        {/* Table Rows */}
        <Skeleton height={40} />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="mt-2"><Skeleton height={35} /></div>
        ))}
      </div>
    </div>
  )
}

export default AdminAttendanceFallback