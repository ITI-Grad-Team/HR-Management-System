import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/config.js";
import BioCard from "../../components/BioCard/BioCard.jsx";
import SectionBlock from "../../components/SectionBlock/SectionBlock.jsx";
import EmployeesFallBack from "../../components/DashboardFallBack/EmployeesFallBack.jsx";
import Pagination from "../../components/Pagination/Pagination.jsx";
import { toast } from "react-toastify";

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchQuery = new URLSearchParams(location.search).get("query")?.toLowerCase() || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8); // Backend page size for results
  const [totalResultsCount, setTotalResultsCount] = useState(0);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery) {
        setResults([]);
        setTotalResultsCount(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Function to create URLSearchParams for consistent query string formatting
        const createSearchParams = (params) => {
          const sp = new URLSearchParams();
          for (const key in params) {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
              sp.append(key, params[key]);
            }
          }
          return sp.toString();
        };

        const hrsParams = {
          page: currentPage,
          page_size: itemsPerPage,
          search: searchQuery,
        };

        const employeesParams = {
          page: currentPage,
          page_size: itemsPerPage,
          search: searchQuery,
          interview_state: "accepted",
        };

        const candidatesParams = {
          page: currentPage,
          page_size: itemsPerPage,
          search: searchQuery,
          interview_state_not: "accepted",
        };

        const [hrsRes, employeesRes, candidatesRes] = await Promise.all([
          axiosInstance.get(`/admin/hrs/?${createSearchParams(hrsParams)}`),
          axiosInstance.get(`/admin/employees/?${createSearchParams(employeesParams)}`),
          axiosInstance.get(`/admin/employees/?${createSearchParams(candidatesParams)}`),
        ]);

        const combinedResults = [
          ...hrsRes.data.results,
          ...employeesRes.data.results,
          ...candidatesRes.data.results,
        ];
        const combinedCount = hrsRes.data.count + employeesRes.data.count + candidatesRes.data.count;

        setResults(combinedResults);
        setTotalResultsCount(combinedCount);

      } catch (err) {
        toast.error("Failed to fetch search results.");
        console.error("Search results fetch error:", err);
        setResults([]);
        setTotalResultsCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchQuery, currentPage, itemsPerPage]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleBackToHome = () => {
    navigate("/dashboard/home");
  };

  const totalPages = Math.ceil(totalResultsCount / itemsPerPage);

  if (loading) {
    return <EmployeesFallBack />;
  }

  return (
    <div className="container py-4">
      <h2 className="text-2xl font-bold mb-4">Search Results for "{searchQuery}"</h2>

      <SectionBlock>
        {searchQuery && results.length > 0 ? (
          <>
            {/* Cards side-by-side using Bootstrap's row and col classes */}
            <div className="row g-4"> {/* Use Bootstrap's row with gutter */}
              {results.map((person) => (
                <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={person.id}> {/* Responsive columns */}
                  <Link
                    to={`/dashboard/employeeDetails/${person.id}`}
                    className="text-decoration-none" // Bootstrap class for no underline
                  >
                    <BioCard
                      name={person.basicinfo?.username || person.basic_info?.username}
                      email={person.user?.username}
                      phone={person.basicinfo?.phone || person.basic_info?.phone}
                      avatar={
                        person.basicinfo?.profile_image ||
                        person.basic_info?.profile_image ||
                        "/default.jpg"
                      }
                      department={person.position}
                      location={person.region}
                      education={person.highest_education_field}
                      isCoordinator={person.is_coordinator}
                      experience={person.years_of_experience}
                      role={person.basic_info?.role}
                      status={person.interview_state}
                    />
                  </Link>
                </div>
              ))}
            </div>
            {/* Conditionally render Pagination only if there's more than one page */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4"> {/* Changed mt-8 to mt-4 for pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-600 py-8">
            {searchQuery ? (
              <p>No results found for "{searchQuery}".</p>
            ) : (
              <p>Enter a search query in the header bar to find employees or candidates.</p>
            )}
          </div>
        )}
      </SectionBlock>

      {/* Back to Home button at the very end, centered */}
      <div className="d-flex justify-content-center mt-5"> {/* Changed mt-8 to mt-5 for more space */}
        <button
          onClick={handleBackToHome}
          className="btn btn-dark btn-lg shadow-sm" // Changed to btn-dark for black color
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default SearchResultsPage;
