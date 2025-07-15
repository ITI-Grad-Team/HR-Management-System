import { useEffect, useState } from "react";
import "./EmployeeDetails.css";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/config";
import { Card, Col, Row } from "react-bootstrap";

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
            <div className="column-1">
              <img src={employee.basicinfo.profile_image} alt="" />

              <h2>{employee.basicinfo.username}</h2>
              <p>{employee.position}</p>
              <p>{employee.region}</p>
              <p>{employee.user.username}</p>
              <p>{employee.phone || "No Phone Recorded"}</p>
              <p>{employee.isCoordinator ? "Coordinator" : ""}</p>
            </div>

            <div className="column-2">
              <div className="grid g-3 mb-4">
                {[
                  {
                    label: "Salary",
                    value: employee.basic_salary,
                    unit: "EGP / month",
                  },
                  {
                    label: "Years of Experience",
                    value: employee.years_of_experience,
                    unit: "Years",
                  },
                  {
                    label: "Total Task Rating",
                    value: employee.total_task_ratings || 0,
                    unit: "% / task",
                  },
                  {
                    label: "Total Overtime Hours",
                    value: employee.total_overtime_hours || 0,
                    unit: "hours / work day",
                  },
                  {
                    label: "Total Lateness Hours",
                    value: employee.total_lateness_hours || 0,
                    unit: "hours / work day",
                  },
                  {
                    label: "Total Absence Days",
                    value: employee.total_absent_days || 0,
                    unit: "days / work day",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="" md={4} lg={2}>
                    <Card className="h-100 text-center shadow-sm">
                      <Card.Body className="p-2">
                        <small className="text-muted d-block mb-1">
                          {item.label}
                        </small>
                        <h5 className="mb-1" style={{ color: "#3B82F6" }}>
                          {item.value?.toFixed(0) ?? "-"}
                          <small
                            className="text-muted d-block"
                            style={{ fontSize: "0.85rem" }}
                          >
                            {item.unit}
                          </small>
                        </h5>
                      </Card.Body>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="loading">Loading employee details...</p>
        )}
      </div>
    </section>
  );
};

export default EmployeeDetails;
