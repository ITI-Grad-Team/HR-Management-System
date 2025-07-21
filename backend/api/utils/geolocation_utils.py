import math
from typing import Tuple, Optional


def calculate_distance_meters(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """
    Calculate the distance between two points on Earth using the Haversine formula.
    Returns distance in meters.
    """
    # Convert latitude and longitude from degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))

    # Radius of Earth in meters
    earth_radius_meters = 6371000
    distance = earth_radius_meters * c

    return distance


def is_within_allowed_location(
    employee_lat: float,
    employee_lon: float,
    building_lat: float,
    building_lon: float,
    allowed_radius_meters: int,
) -> Tuple[bool, float]:
    """
    Check if employee's location is within the allowed radius of the building.
    Returns (is_within_radius, actual_distance_meters).
    """
    distance = calculate_distance_meters(
        employee_lat, employee_lon, building_lat, building_lon
    )
    is_within = distance <= allowed_radius_meters
    return is_within, distance


def validate_attendance_location(
    user, employee_lat: Optional[float], employee_lon: Optional[float]
) -> Tuple[bool, str]:
    """
    Validate if an employee's location allows for attendance check-in/out.
    Returns (is_valid, message).
    """
    if not hasattr(user, "employee") or not user.employee:
        return False, "Employee profile not found"

    employee = user.employee
    if not employee.region:
        return False, "Employee region not configured"

    region = employee.region

    # If region doesn't have geolocation configured, allow attendance (backward compatibility)
    # if region.latitude is None or region.longitude is None:
    #     return True, "Geolocation validation not configured for your region"
    if region.latitude is None or region.longitude is None:
        return (
            False,
            "Your region doesn't have a configured office location. Attendance blocked. Contact HR.",
        )

    # If employee didn't provide location, reject
    if employee_lat is None or employee_lon is None:
        return (
            False,
            "Location access is required for attendance. Please enable location services.",
        )

    # Validate location
    is_within, distance = is_within_allowed_location(
        employee_lat,
        employee_lon,
        region.latitude,
        region.longitude,
        region.allowed_radius_meters,
    )

    if is_within:
        return True, f"Location validated. You are {distance:.0f}m from the office."
    else:
        return (
            False,
            f"You are {distance:.0f}m away from the office. You must be within {region.allowed_radius_meters}m to check in.",
        )
