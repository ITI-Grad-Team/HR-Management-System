import { useEffect, useState, useMemo } from "react";
import {
  Table,
  Form,
  Row,
  Col,
  Button,
  Spinner,
  Pagination,
  Badge,
  InputGroup,
} from "react-bootstrap";
import Select from "react-select";
import axiosInstance from "../../api/config";
import "./ViewAllApplicationLinks.css";
import ApplicationsReportFallback from "../DashboardFallBack/ApplicationsReportFallback";
import { useAuth } from "../../hooks/useAuth";

const PAGE_SIZE = 10;

const ViewAllApplicationLinks = () => {
  /* ─────────────── State ─────────────── */
  const [links, setLinks] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [positions, setPositions] = useState([]);
  const [skills, setSkills] = useState([]); // keep skills list for display
  const [filterPosition, setFilterPosition] = useState(null);
  const [filterCoordinator, setFilterCoordinator] = useState(null);

  const { role } = useAuth();
  const apiPrefix = role === "admin" ? "admin" : "hr";

  /* ─────────────── Fetch Positions & Skills once ─────────────── */
  useEffect(() => {
    (async () => {
      try {
        const [posRes, skRes] = await Promise.all([
          axiosInstance.get(`${apiPrefix}/positions/`),
          axiosInstance.get(`${apiPrefix}/skills/`),
        ]);
        const posOpts = (
          Array.isArray(posRes.data) ? posRes.data : posRes.data.results
        ).map((p) => ({
          value: p.id,
          label: p.name,
        }));
        setPositions(posOpts);

        const skOpts = (
          Array.isArray(skRes.data) ? skRes.data : skRes.data.results
        ).map((s) => ({
          value: s.id,
          label: s.name,
        }));
        setSkills(skOpts);
      } catch (err) {
        console.error("Error fetching positions/skills", err);
      }
    })();
  }, [apiPrefix]);

  /* ─────────────── Fetch Links ─────────────── */
  useEffect(() => {
    const fetchLinks = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          search,
          position: filterPosition?.value,
          // skills: filterSkills.map((s) => s.value).join(","),
          is_coordinator: filterCoordinator?.value,
        };
        Object.keys(params).forEach(
          (k) =>
            (params[k] === undefined ||
              params[k] === "" ||
              params[k] === null) &&
            delete params[k]
        );

        const { data } = await axiosInstance.get(
          `${apiPrefix}/application-links/`,
          { params }
        );
        setLinks(data.results);
        setCount(data.count);
      } catch (err) {
        console.error("Error fetching links", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, [page, search, filterPosition, filterCoordinator, apiPrefix]);

  /* ─────────────── Helpers ─────────────── */
  const totalPages = useMemo(() => Math.ceil(count / PAGE_SIZE) || 1, [count]);

  const renderPagination = () => (
    <Pagination className="justify-content-center mt-3">
      <Pagination.First disabled={page === 1} onClick={() => setPage(1)} />
      <Pagination.Prev
        disabled={page === 1}
        onClick={() => setPage((p) => p - 1)}
      />
      {[...Array(totalPages).keys()].slice(0, 5).map((i) => (
        <Pagination.Item
          key={i + 1}
          active={i + 1 === page}
          onClick={() => setPage(i + 1)}
        >
          {i + 1}
        </Pagination.Item>
      ))}
      <Pagination.Next
        disabled={page === totalPages}
        onClick={() => setPage((p) => p + 1)}
      />
      <Pagination.Last
        disabled={page === totalPages}
        onClick={() => setPage(totalPages)}
      />
    </Pagination>
  );

  if (loading) {
    return <ApplicationsReportFallback />
  }

  /* ─────────────── UI ─────────────── */
  return (
    <div className="view-links-wrapper bg-surface p-4 rounded shadow-sm">
      {/* Filters */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <InputGroup>
            <Form.Control
              placeholder="Search by Distinction…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
            <Button variant="outline-secondary" onClick={() => setSearch("")}>
              Reset
            </Button>
          </InputGroup>
        </Col>
        <Col md={4}>
          <Select
            options={positions}
            value={filterPosition}
            onChange={(v) => {
              setPage(1);
              setFilterPosition(v);
            }}
            placeholder="Filter by Position…"
            isClearable
            classNamePrefix="react-select"
          />
        </Col>
        <Col md={4}>
          <Select
            options={[
              { value: true, label: "Coordinator" },
              { value: false, label: "Non‑Coordinator" },
            ]}
            value={filterCoordinator}
            onChange={(v) => {
              setPage(1);
              setFilterCoordinator(v);
            }}
            placeholder="Filter by Coordinator…"
            isClearable
            classNamePrefix="react-select"
          />
        </Col>
      </Row>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <Table responsive hover className="align-middle">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>URL</th>
              <th>Distinction</th>
              <th>Coordinator</th>
              <th>Remaining</th>
              <th>Position</th>
              <th>Skills</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.id}>
                <td>{link.id}</td>
                <td>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-decoration-none"
                    style={{color: "#222831"}}
                  >
                    {link.url}
                  </a>
                </td>
                <td>{link.distinction_name}</td>
                <td>{link.is_coordinator ? "Yes" : "No"}</td>
                <td>{link.number_remaining_applicants_to_limit}</td>
                <td>
                  {positions.find((p) => p.value === link.position)?.label ||
                    link.position}
                </td>
                <td>
                  {link.skills?.map((sid) => {
                    const sk = skills.find((s) => s.value === sid);
                    return (
                      <Badge  text="light" key={sid} className="me-1 skills">
                        {sk ? sk.label : sid}
                      </Badge>
                    );
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Pagination */}
      {totalPages > 1 && renderPagination()}
    </div>
  );
};

export default ViewAllApplicationLinks;
