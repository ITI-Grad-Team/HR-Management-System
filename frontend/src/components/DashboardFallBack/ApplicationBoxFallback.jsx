import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const ApplicationBoxFallback = () => {
  return (
   <div
  className="d-flex justify-content-center "
  style={{ padding: "2rem" }}
>
  {/* Form Container */}
  <div className="p-4 rounded-3 bg-white shadow-sm" style={{ maxWidth: 600, width: "100%" }}>
    <h4 className="mb-4"><Skeleton width={250} /></h4>

    {/* Distinction Name */}
    <div className="mb-3">
      <label><Skeleton width={120} /></label>
      <Skeleton height={40} />
    </div>

    {/* Position */}
    <div className="mb-3">
      <label><Skeleton width={80} /></label>
      <Skeleton height={40} />
    </div>

    {/* Skills */}
    <div className="mb-3">
      <label><Skeleton width={60} /></label>
      <Skeleton height={40} />
    </div>

    {/* Remaining Applicants + Checkbox */}
    <div className="mb-3 d-flex align-items-center gap-3">
      <div style={{ flex: 1 }}>
        <label><Skeleton width={150} /></label>
        <Skeleton height={40} />
      </div>
      <div className="mt-4">
        <Skeleton circle height={20} width={20} />
        <Skeleton width={90} style={{ display: "inline-block", marginLeft: 8 }} />
      </div>
    </div>

    {/* Generate Link Button */}
    <div>
      <Skeleton height={45} width={180} />
    </div>
  </div>
</div>

  )
}

export default ApplicationBoxFallback