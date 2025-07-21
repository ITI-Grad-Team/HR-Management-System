import axiosInstance from "./config";

// Get all regions
export const getRegions = () => {
    return axiosInstance.get('/hr/regions/');
};

// Update region location settings
export const updateRegionLocation = (regionId, locationData) => {
    return axiosInstance.patch(`/hr/regions/${regionId}/update_location/`, locationData);
};

// For admin users
export const getRegionsAdmin = () => {
    return axiosInstance.get('/admin/regions/');
};

export const updateRegionLocationAdmin = (regionId, locationData) => {
    return axiosInstance.patch(`/admin/regions/${regionId}/update_location/`, locationData);
};
