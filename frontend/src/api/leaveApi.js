import axiosInstance from "./config";

// Employee actions
export const getMyLeaveRequests = () => {
    return axiosInstance.get('/casual-leave/my-requests/');
};

export const getMyLeaveBalance = () => {
    return axiosInstance.get('/casual-leave/my-leave-balance/');
};

export const createLeaveRequest = (data) => {
    return axiosInstance.post('/casual-leave/', data);
};

// HR/Admin actions
export const getAllLeaveRequests = () => {
    return axiosInstance.get('/casual-leave/');
};

export const approveLeaveRequest = (id) => {
    return axiosInstance.patch(`/casual-leave/${id}/approve/`);
};

export const rejectLeaveRequest = (id, data) => {
    return axiosInstance.patch(`/casual-leave/${id}/reject/`, data);
}; 