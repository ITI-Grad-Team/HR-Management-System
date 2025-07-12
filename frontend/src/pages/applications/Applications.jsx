import { useState } from 'react';
import ApplicationLinkBox from '../../components/ApplicationLinkBox/ApplicationLinkBox';
import { Container, Tabs, Tab } from 'react-bootstrap';
import { FaAngellist, FaLink, FaList, FaListAlt, FaPage4, FaPagelines, FaPager } from 'react-icons/fa';
import ViewAllApplicationLinks from '../../components/ViewAllApplicationLinks/ViewAllApplicationLinks';
import { useAuth } from '../../context/AuthContext';


const Applications = () => {
  const [key, setKey] = useState('generate');
  const { role } = useAuth();

  return (
    <>
    { role === "hr" && (
    <Container className="mt-4">
      <Tabs
        id="applications-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-4 border rounded bg-light p-2 shadow-sm"
        justify
        variant="pills"
      >
        <Tab eventKey="generate" title={<span className="fw-semibold dark"><FaLink /> Generate New Link</span>}>
          <ApplicationLinkBox />
        </Tab>
        <Tab eventKey="all" title={<span className="fw-semibold">All Application Links</span>}>
          <div className="p-4 bg-white rounded shadow text-center">
           <ViewAllApplicationLinks />
          </div>
        </Tab>
      </Tabs>
    </Container>
    )}
     { role === "admin" && (
      <div className="p-4 bg-white rounded shadow text-center">
           <ViewAllApplicationLinks />
          </div>
    )}
    </>
  );
};

export default Applications;
