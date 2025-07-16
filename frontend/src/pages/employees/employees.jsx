import "./employees.css";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/config.js";
import BioCard from "../../components/BioCard/BioCard.jsx";
import SectionBlock from "../../components/SectionBlock/SectionBlock.jsx";
import Filters from "../../components/Filters/Filters.jsx";
import Slider from "react-slick";
const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [positionSelect, setPositionSelect] = useState("");
  const [regionSelect, setRegionSelect] = useState("");
  const [isCoordinatorValue, setIsCoordinatorValue] = useState(false);
  const { role } = useAuth();

  useEffect(() => {
    axiosInstance
      .get("/admin/employees/?interview_state=accepted")
      .then((res) => setEmployees(res.data.results))
      .catch((err) => console.error(err));
  }, []);

  const filteredEmployees = employees.filter((employee) => {
    const matchesPosition = positionSelect
      ? employee.position === positionSelect
      : true;
    const matchesRegion = regionSelect
      ? employee.region === regionSelect
      : true;
    const matchesCoordinator = isCoordinatorValue
      ? employee.isCoordinator === isCoordinatorValue
      : true;

    return matchesPosition && matchesRegion && matchesCoordinator;
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
            <div className="card-placeholder">HR Card</div>
            <div className="card-placeholder">HR Card</div>
          </SectionBlock>
        )}

        {/* Employees Section */}
   <SectionBlock
  title="Employees"
  extraHeader={
    <Filters
      positionSelect={positionSelect}
      regionSelect={regionSelect}
      isCoordinatorValue={isCoordinatorValue}
      onPositionChange={(e) => setPositionSelect(e.target.value)}
      onRegionChange={(e) => setRegionSelect(e.target.value)}
      onCoordinatorToggle={() => setIsCoordinatorValue(!isCoordinatorValue)}
      onClear={() => {
        setPositionSelect("");
        setRegionSelect("");
        setIsCoordinatorValue(false);
      }}
    />
  }
>
  
  {filteredEmployees.length > 0 ? (
    <div className="slider-wrapper">
      <div className="slider-container">

      <Slider {...sliderSettings}>
        {filteredEmployees.map((employee) => (
          <div key={employee.id}>
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

      </div>
    </div>
  );
};

export default Employees;

/* 

/*   {/* Candidates Section *//*}*/
      /*  {/* <div className="section">
          <div className="section-heading">
            <h2>Candidates</h2>
          </div>
          <div className="card-grid">
            <div className="card-placeholder">Candidate Card</div>
            <div className="card-placeholder">Candidate Card</div>
          </div>
        </div> *//*} */ 