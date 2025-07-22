import axiosInstance from "./config";
import cacheManager from "../utils/cacheManager";

// Employee actions
export const getMyLeaveRequests = async (page = 1, pageSize = 20) => {
    const cacheKey = cacheManager.generateLeaveKey(page, pageSize, { type: 'my-requests' });
    const cached = cacheManager.get(cacheKey);

    if (cached) {
        return { data: cached };
    }

    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    const response = await axiosInstance.get(`/casual-leave/my-requests/?${params.toString()}`);
    cacheManager.set(cacheKey, response.data);
    return response;
};

export const getMyLeaveBalance = async () => {
    const cacheKey = cacheManager.generateBalanceKey();
    const cached = cacheManager.get(cacheKey);

    if (cached) {
        return { data: cached };
    }

    const response = await axiosInstance.get('/casual-leave/my-leave-balance/');
    cacheManager.set(cacheKey, response.data);
    return response;
};

export const createLeaveRequest = async (data) => {
    const response = await axiosInstance.post('/casual-leave/', data);

    // Clear relevant caches after creating a new request
    cacheManager.clear('leave_');
    cacheManager.clear('balance');

    return response;
};

// HR/Admin actions
export const getAllLeaveRequests = async (page = 1, pageSize = 20, filters = {}) => {
    const cacheKey = cacheManager.generateLeaveKey(page, pageSize, filters);
    const cached = cacheManager.get(cacheKey);

    if (cached) {
        return { data: cached };
    }

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

    const response = await axiosInstance.get(`/casual-leave/?${params.toString()}`);
    cacheManager.set(cacheKey, response.data);
    return response;
};

export const approveLeaveRequest = async (id) => {
    const response = await axiosInstance.patch(`/casual-leave/${id}/approve/`);

    // Clear caches after approval
    cacheManager.clear('leave_');

    return response;
};

export const rejectLeaveRequest = async (id, data) => {
    const response = await axiosInstance.patch(`/casual-leave/${id}/reject/`, data);

    // Clear caches after rejection
    cacheManager.clear('leave_');

    return response;
}; 