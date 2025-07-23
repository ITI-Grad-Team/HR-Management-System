import axiosInstance from "./config";

// Get headquarters settings
export const getHeadquarters = () => {
    return axiosInstance.get('/admin/headquarters/');
};

// Update headquarters settings
export const updateHeadquarters = (data) => {
    return axiosInstance.patch('/admin/headquarters/1/', data);
};

// Update headquarters location using current device location
export const updateHeadquartersLocation = (locationData) => {
    return axiosInstance.patch('/admin/headquarters/update_location/', locationData);
};
