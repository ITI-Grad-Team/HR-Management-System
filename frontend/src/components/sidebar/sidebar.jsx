import { Nav } from "react-bootstrap";
import { FaHome, FaUserFriends, FaChartBar, FaBell } from "react-icons/fa";

export default function Sidebar() {
  return (
    <div
      style={{
        height: "100vh",
        width: "80px",
        backgroundColor: "#fff",
        borderRight: "1px solid #E5E7EB",
        boxShadow: "0 0 10px rgba(0,0,0,0.05)",
        paddingTop: "20px",
      }}
      className="d-flex flex-column align-items-center"
    >
      
      <Nav defaultActiveKey="/home" className="flex-column gap-4">
        <Nav.Link href="#" className="text-center text-muted">
          <FaHome size={20} />
        </Nav.Link>
        <Nav.Link href="#" className="text-center text-muted">
          <FaUserFriends size={20} />
        </Nav.Link> 
        
        <Nav.Link href="#" className="text-center text-muted">
          <FaChartBar size={20} />
        </Nav.Link>
        <Nav.Link href="#" className="text-center text-muted">
          <FaBell size={20} />
        </Nav.Link>
      </Nav>
    </div>
  );
}
