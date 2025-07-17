import axiosInstance from "./config";

// Employee actions
export const checkIn = (macAddress) => {
  return axiosInstance.post('/attendance/check_in/', { mac_address: macAddress });
};

export const checkOut = () => {
  return axiosInstance.patch('/attendance/check_out/');
};

export const getMyAttendance = (params) => {
    return axiosInstance.get('/attendance/', { params });
};

export const canRequestOvertime = () => {
    return axiosInstance.get('/attendance/can_request_overtime/');
};

export const createOvertimeRequest = (data) => {
    return axiosInstance.post('/overtime-requests/', data);
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

export const approveOvertimeRequest = (id, data) => {
    return axiosInstance.patch(`/overtime-requests/${id}/approve/`, data);
};

export const rejectOvertimeRequest = (id, data) => {
    return axiosInstance.patch(`/overtime-requests/${id}/reject/`, data);
}; 