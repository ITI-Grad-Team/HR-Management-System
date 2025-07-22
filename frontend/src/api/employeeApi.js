import axiosInstance from "./config";

/**
 * Search for employees with pagination and server-side filtering
 * @param {string} search - Search term for username/email
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Number of results per page (default: 20)
 * @param {string} role - User role ('admin' or 'hr')
 * @returns {Promise} - Promise with search results
 */
export const searchEmployees = (search = '', page = 1, pageSize = 20, role = 'hr') => {
    const endpoint = role === 'admin' ? '/admin/employees/' : '/hr/employees/';

    const params = new URLSearchParams();
    if (search.trim()) {
        params.append('search', search.trim());
    }
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    const url = `${endpoint}?${params.toString()}`;
    return axiosInstance.get(url);
};

/**
 * Get employee by ID for detailed view
 * @param {number|string} id - Employee ID
 * @param {string} role - User role ('admin' or 'hr')
 * @returns {Promise} - Promise with employee details
 */
export const getEmployeeById = (id, role = 'hr') => {
    const endpoint = role === 'admin' ? `/admin/employees/${id}/` : `/hr/employees/${id}/`;
    return axiosInstance.get(endpoint);
};
