import axiosInstance from "./config";

// Employee actions
export const getMyLeaveRequests = (page = 1, pageSize = 20) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    return axiosInstance.get(`/casual-leave/my-requests/?${params.toString()}`);
};

export const getMyLeaveBalance = () => {
    return axiosInstance.get('/casual-leave/my-leave-balance/');
};

export const createLeaveRequest = (data) => {
    return axiosInstance.post('/casual-leave/', data);
};

// HR/Admin actions
export const getAllLeaveRequests = (page = 1, pageSize = 20, filters = {}) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    // Add filters
    if (filters.status) {
        params.append('status', filters.status);
    }
    if (filters.search) {
        params.append('search', filters.search);
    }
    if (filters.ordering) {
        params.append('ordering', filters.ordering);
    }

    return axiosInstance.get(`/casual-leave/?${params.toString()}`);
};

export const approveLeaveRequest = (id) => {
    return axiosInstance.patch(`/casual-leave/${id}/approve/`);
};

export const rejectLeaveRequest = (id, data) => {
    return axiosInstance.patch(`/casual-leave/${id}/reject/`, data);
}; 