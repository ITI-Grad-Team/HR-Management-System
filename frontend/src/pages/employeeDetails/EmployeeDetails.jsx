import { useEffect, useState } from "react";
import "./EmployeeDetails.css";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/config";

const EmployeeDetails = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    axiosInstance.get(`/admin/employees/${id}/`).then((response) => {
      setEmployee(response.data);
      console.log(employee);
    });
  });

  return (
    <section>
      <div>
        {employee ? (
          <div className="employee-details">
            <h2>{employee.basicinfo.username}</h2>
            <p>
              <strong>Position:</strong> {employee.position}
            </p>
            <p>
              <strong>Region:</strong> {employee.region}
            </p>
            <p>
              <strong>Email:</strong> {employee.email}
            </p>
            <p>
              <strong>Phone:</strong> {employee.basicinfo.phone}
            </p>
            <p>
              <strong>Is Coordinator:</strong>{" "}
              {employee.isCoordinator ? "Yes" : "No"}
            </p>
          </div>
        ) : (
          <p>Loading employee details...</p>
        )}
      </div>
    </section>
  );
};

export default EmployeeDetails;
