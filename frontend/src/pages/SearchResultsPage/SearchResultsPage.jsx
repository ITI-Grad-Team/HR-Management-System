import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/config.js";
import BioCard from "../../components/BioCard/BioCard.jsx";
import SectionBlock from "../../components/SectionBlock/SectionBlock.jsx";
import EmployeesFallBack from "../../components/DashboardFallBack/EmployeesFallBack.jsx";
import Pagination from "../../components/Pagination/Pagination.jsx";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth.js";

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();
  const searchQuery = new URLSearchParams(location.search).get("query")?.toLowerCase() || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8); 
  const [totalResultsCount, setTotalResultsCount] = useState(0);

  useEffect(() => {
      document.title = "Search | HERA";
    }, []);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery || !role) {
        setResults([]);
        setTotalResultsCount(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const createSearchParams = (params) => {
          const sp = new URLSearchParams();
          for (const key in params) {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
              sp.append(key, params[key]);
            }
          }
          return sp.toString();
        };

        const baseApiUrl = role === 'admin' ? '/admin' : '/hr';

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

        const promises = [
          axiosInstance.get(`${baseApiUrl}/employees/?${createSearchParams(employeesParams)}`),
          axiosInstance.get(`${baseApiUrl}/employees/?${createSearchParams(candidatesParams)}`),
        ];

        if (role === 'admin') {
          const hrsParams = {
            page: currentPage,
            page_size: itemsPerPage,
            search: searchQuery,
          };
          promises.unshift(axiosInstance.get(`/admin/hrs/?${createSearchParams(hrsParams)}`));
        }

        const responses = await Promise.all(promises);

        const combinedResults = responses.flatMap(res => res.data.results);
        const combinedCount = responses.reduce((acc, res) => acc + res.data.count, 0);
        
        setResults(combinedResults);
        setTotalResultsCount(combinedCount);

      } catch (err) {
        if (err.response?.status !== 403) { // Don't show toast for auth errors
          toast.error("Failed to fetch search results.");
        }
        console.error("Search results fetch error:", err);
        setResults([]);
        setTotalResultsCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchQuery, currentPage, itemsPerPage, role]);

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
            
            <div className="row g-4"> 
              {results.map((person) => (
                <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={person.id}> 
                  <Link
                    to={`/dashboard/employeeDetails/${person.id}`}
                    className="text-decoration-none"  
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
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">  
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

      <div className="d-flex justify-content-center mt-5">  
        <button
          onClick={handleBackToHome}
          className="btn btn-dark btn-lg shadow-sm"  
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default SearchResultsPage;
