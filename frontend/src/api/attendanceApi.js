import axiosInstance from "./config";

// Employee actions
export const getCheckInStatus = () => {
    return axiosInstance.get('/attendance/check_in_status/');
};

export const checkIn = (macAddress) => {
  return axiosInstance.post('/attendance/check_in/', { mac_address: macAddress });
};

export const checkOut = () => {
  return axiosInstance.patch('/attendance/check_out/');
};

export const createOvertimeRequest = (data) => {
    return axiosInstance.post('/overtime-requests/', data);
};

export const getMyAttendance = (params) => {
    return axiosInstance.get('/attendance/', { params });
};

export const canRequestOvertime = () => {
    return axiosInstance.get('/attendance/can_request_overtime/');
};


// HR/Admin actions
export const getAllAttendance = (params) => {
    return axiosInstance.get('/attendance/', { params });
};

export const createManualAttendance = (data) => {
    return axiosInstance.post('/attendance/', data);
};

export const updateAttendance = (id, data) => {
    return axiosInstance.put(`/attendance/${id}/`, data);
};

export const getPendingOvertimeRequests = () => {
    return axiosInstance.get('/overtime-requests/pending/');
};

export const getRecentOvertimeRequests = () => {
    return axiosInstance.get('/overtime-requests/recent/');
};

export const revertOvertimeRequest = (id) => {
    return axiosInstance.patch(`/overtime-requests/${id}/revert_to_pending/`);
};

export const approveOvertimeRequest = (id, data) => {
    return axiosInstance.patch(`/overtime-requests/${id}/approve/`, data);
};

export const rejectOvertimeRequest = (id, data) => {
    return axiosInstance.patch(`/overtime-requests/${id}/reject/`, data);
}; 