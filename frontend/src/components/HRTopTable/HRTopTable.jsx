import React, { useEffect, useState } from "react";
import { Card, Badge, Spinner, Accordion, Alert } from "react-bootstrap";
import axiosInstance from "../../api/config";
import HrAdminLowerFallback from "../DashboardFallBack/HrAdminLowerFallback";


const formatHeader = (str) => {
  return str
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatValue = (value, col) => {
  if (value === null || value === undefined) return "N/A";

  if (typeof value === "number") {
    if (col === "rank") {
      return `#${Math.round(value)}`;
    }
    const rounded = Number(value).toFixed(2);
    return rounded;
  }
  return value;
};

export default function HRTopTable() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    const url = "/hr/top-interviewed-employees/";

    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(url);
      if (res.data.length > 0) {
        setData(res.data);
        setColumns(
          Object.keys(res.data[0]).filter(
            (col) => col !== "rank" && col !== "username"
          )
        );
      } else {
        setData([]);
        setColumns([]);
      }
    } catch (err) {
      console.error("Error fetching top employees:", err);
      setError("Failed to load employee data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mt-4">
        <h5>Top Of Your Hires</h5>
      </div>

      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center my-5">
          <HrAdminLowerFallback />
          <p className="mt-2">Loading employee data...</p>
        </div>
      ) : data.length === 0 ? (
        <Card className="mt-3">
          <Card.Body className="text-center py-5">
            No employee data available
          </Card.Body>
        </Card>
      ) : (
        <Accordion className="mt-3" defaultActiveKey="0">
          {data.map((item, index) => (
            <Accordion.Item eventKey={index.toString()} key={index}>
              <Accordion.Header>
                <div className="d-flex align-items-center w-100">
                  <span className="me-2 fw-bold">
                    #{item.rank} - {item.username}
                  </span>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <div className="row g-2">
                  {" "}
                  {/* Added g-2 for consistent spacing between rows */}
                  {columns.map((col) => (
                    <div className="col-md-6" key={col}>
                      <div className="d-flex justify-content-between p-2 bg-light rounded">
                        {" "}
                        {/* Added cell styling */}
                        <span className="text-muted">{formatHeader(col)}:</span>
                        <span
                          className="fw-medium"
                        >
                          {formatValue(item[col], col)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </>
  );
}
