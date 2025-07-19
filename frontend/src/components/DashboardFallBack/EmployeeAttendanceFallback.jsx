import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const EmployeeAttendanceFallback = () => (
    <div className="p-4">
        {/* Title */}
        <div className="mb-4">
            <Skeleton height={30} width={220} />
        </div>

        {/* Attendance Card */}
        <div className="mb-4">
            <Skeleton height={100} width="100%" borderRadius={12} />
        </div>

        {/* Table Placeholder */}
        <div>
            <Skeleton height={20} width="100%" className="mb-2" />
            {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={40} width="100%" className="mb-2" />
            ))}
        </div>
    </div>
);

export default EmployeeAttendanceFallback;
