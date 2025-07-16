import "./employees.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/config.js";
import BioCard from "../../components/BioCard/BioCard.jsx";
import SectionBlock from "../../components/SectionBlock/SectionBlock.jsx";
import Filters from "../../components/Filters/Filters.jsx";
import Slider from "react-slick";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [hrs, setHrs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const { role } = useAuth();
  const [employeeFilters, setEmployeeFilters] = useState({
  position: "",
  region: "",
  isCoordinator: false,
});

const [candidateFilters, setCandidateFilters] = useState({
  position: "",
  region: "",
});


useEffect(() => {
  const fetchEmployees = async () => {
    try {
      const employeeEndpoint = role === "admin"
        ? "/admin/employees/?interview_state=accepted"
        : "/hr/employees/?interview_state=accepted";
      const candidateEndpoint = role === "hr"
        ? "/hr/employees/?interview_state=not_accepted"
        : "/hr/employees/?interview_state=not_accepted";

      const employeeRes = await axiosInstance.get(employeeEndpoint);
      setEmployees(employeeRes.data.results);
      localStorage.setItem("employees", JSON.stringify(employeeRes.data.results));

      if (role === "admin") {
        const hrRes = await axiosInstance.get("/admin/hrs/");
        setHrs(hrRes.data.results); 
        localStorage.setItem("hrs", JSON.stringify(hrRes.data.results));
      }
      if (role === "hr") {
        const candidateRes = await axiosInstance.get(candidateEndpoint);
        setCandidates(candidateRes.data.results);
        localStorage.setItem("candidates", JSON.stringify(candidateRes.data.results));
      }
    } catch (err) {
      console.error(err);
    }
  };

  fetchEmployees();
  }, [role]);
  const filteredEmployees = employees.filter((employee) => {
    const { position, region, isCoordinator } = employeeFilters;
    return (
      (position ? employee.position === position : true) &&
      (region ? employee.region === region : true) &&
      (isCoordinator ? employee.isCoordinator === isCoordinator : true)
    );
  });

  const filteredCandidates = candidates.filter((candidate) => {
    const { position, region } = candidateFilters;
    return (
      (position ? candidate.position === position : true) &&
      (region ? candidate.region === region : true)
    );
  });
    const sliderSettings = {
      dots: true,
      infinite: false,
      speed: 500,
      slidesToShow: 3,
      slidesToScroll: 1,
  
      responsive: [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 2,
          }
        },
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 1,
          }
        }
      ]
    };

  return (
    <div className="directories d-flex">
      <div
        className="flex-grow-1"
        style={{ backgroundColor: "#F8FAFC", minHeight: "100vh" }}
      >
        {/* HR Section */}
        {role === "admin" && (
          <SectionBlock title="HRs">
          {hrs.length > 0 ? (
            <div className="slider-wrapper">
              <div className="slider-container">
                <Slider {...sliderSettings}>
                  {hrs
                .filter((hr) => hr.basic_info)
                .map((hr) => (
                  <div key={hr.id}>
                    <Link to={`/dashboard/hrDetails/${hr.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <BioCard
                        name={hr.basic_info.username}
                        role={hr.basic_info.role}
                        email={hr.basic_info.email}
                        phone={hr.basic_info.phone}
                        avatar={hr.basic_info.profile_image || ""}
                        department={hr.department}
                        location={hr.region}
                        bio={hr.bio}
                        status={hr.status}
                      />
                    </Link>
                  </div>
              ))}
              </Slider>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted mt-4">
                No HRs found.
              </div>
          )}
        </SectionBlock>
        )}
        {/* Employees Section */}
        <SectionBlock
          title="Employees"
          extraHeader={
          <Filters
          positionSelect={employeeFilters.position}
          regionSelect={employeeFilters.region}
          isCoordinatorValue={employeeFilters.isCoordinator}
          onPositionChange={(e) =>
            setEmployeeFilters({ ...employeeFilters, position: e.target.value })
          }
          onRegionChange={(e) =>
            setEmployeeFilters({ ...employeeFilters, region: e.target.value })
          }
          onCoordinatorToggle={() =>
            setEmployeeFilters({
              ...employeeFilters,
              isCoordinator: !employeeFilters.isCoordinator,
            })
          }
          onClear={() =>
            setEmployeeFilters({ position: "", region: "", isCoordinator: false })
          }
        />}>
          {filteredEmployees.length > 0 ? (
            <div className="slider-wrapper">
              <div className="slider-container">
                <Slider {...sliderSettings}>
                  {filteredEmployees.map((employee) => (
                    <div key={employee.id}>
                      <Link to={`/dashboard/employeeDetails/${employee.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <BioCard
                          name={employee.basic_info.username}
                          role={employee.basic_info.role}
                          email={employee.basic_info.email}
                          phone={employee.basic_info.phone}
                          avatar={employee.basic_info.profile_image || ""}
                          department={employee.department}
                          location={employee.region}
                          bio={employee.bio}
                          status={employee.status}
                        />
                      </Link>
                    </div>
                  ))}
                </Slider>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted mt-4">
              No employees found matching your filters.
            </div>
          )}
        </SectionBlock>

         {/* Candidates Section */ }
        {role === "hr" && (
        <SectionBlock
          title="Candidates"
          extraHeader={
          <Filters
            positionSelect={candidateFilters.position}
            regionSelect={candidateFilters.region}
            onPositionChange={(e) =>
              setCandidateFilters({ ...candidateFilters, position: e.target.value })
            }
            onRegionChange={(e) =>
              setCandidateFilters({ ...candidateFilters, region: e.target.value })
            }
            onClear={() =>
              setCandidateFilters({ position: "", region: "" })
            }
          />

          }
        >
          {filteredCandidates.length > 0 ? (
            <div className="slider-wrapper">
              <div className="slider-container">
                <Slider {...sliderSettings}>
                  {filteredCandidates.map((candidate) => (
                    <div key={candidate.id}>
                      <Link to={`/dashboard/candidateDetails/${candidate.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <BioCard
                          name={candidate.basic_info.username}
                          role={candidate.basic_info.role}
                          email={candidate.basic_info.email}
                          phone={candidate.basic_info.phone}
                          avatar={candidate.basic_info.profile_image || ""}
                          department={candidate.department}
                          location={candidate.region}
                          bio={candidate.bio}
                          status={candidate.status}
                        />
                      </Link>
                    </div>
                  ))}
                </Slider>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted mt-4">
              No candidates found matching your filters.
            </div>
          )}
        </SectionBlock>     
)}
      </div>
    </div>
  );
};

export default Employees;