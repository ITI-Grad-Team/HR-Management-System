import React from 'react'
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const AdminLeaveFallback = () => {
  return (
    <div className="p-4">
          
    
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
              <div key={i} className="mt-2"><Skeleton height={25} /></div>
            ))}
          </div>

          <div className="bg-white shadow-sm rounded-3 p-3 mt-4">
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
              <div key={i} className="mt-2"><Skeleton height={25} /></div>
            ))}
          </div>
        </div>
  )
}

export default AdminLeaveFallback