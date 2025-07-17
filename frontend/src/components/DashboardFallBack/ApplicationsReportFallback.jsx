import React from 'react'
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const ApplicationsReportFallback = () => {
   return (
       <div className="p-4 mt-4">
    
     <div className="d-flex gap-2 mb-4 flex-wrap">
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ flex: "1 1 200px" }}>
              <Skeleton height={30} width={300} borderRadius={"15px"} />
            </div>
          ))}
        </div>
  
      <div>
        <Skeleton height={20} width="100%" className="mb-2" />
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} height={40} width="100%" className="mb-2" />
        ))}
      </div>
    </div>
   )
}

export default ApplicationsReportFallback;