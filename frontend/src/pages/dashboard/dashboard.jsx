import ProfileContainer from "../../components/BioCard/ProfileContainer"; 
import Sidebar from "../../components/sidebar/sidebar.jsx";
import HeaderBar from "../../components/headerBar/headerBar";
import StatCards from "../../components/statCards/statCards";
import CandidateCharts from "../../components/CandidateCharts/CandidateCharts";
import RecruitersTable from "../../components/RecruitersTable/RecruitersTable";
import { Container } from "react-bootstrap";

export default function DashboardPage() {
  return (
    <div className="d-flex">
      <Sidebar />

      <div
        className="flex-grow-1 p-4"
        style={{ backgroundColor: "#F8FAFC", minHeight: "100vh" }}
      >
        <HeaderBar />
        
        <div className="my-4">
          <ProfileContainer />
        </div>

        <StatCards />
        <CandidateCharts />

        <div className="my-4">
          <RecruitersTable />
        </div>
      </div>
    </div>
    
  );
}