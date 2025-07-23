import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { getHeadquarters, updateHeadquarters } from '../../api/headquartersApi';
import { getCurrentLocation } from '../../utils/geolocation';
import { toast } from 'react-toastify';

const HeadquartersSettings = () => {
    const [headquarters, setHeadquarters] = useState({
        name: '',
        latitude: '',
        longitude: '',
        allowed_radius_meters: 150
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    useEffect(() => {
        fetchHeadquarters();
    }, []);

    const fetchHeadquarters = async () => {
        try {
            setLoading(true);
            const response = await getHeadquarters();
            setHeadquarters(response.data);
        } catch (error) {
            console.error('Failed to fetch headquarters:', error);
            toast.error('Failed to load headquarters settings');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setHeadquarters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleGetCurrentLocation = async () => {
        setLocationLoading(true);
        try {
            const location = await getCurrentLocation();
            setHeadquarters(prev => ({
                ...prev,
                latitude: location.latitude.toString(),
                longitude: location.longitude.toString()
            }));
            toast.success('Current location acquired successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to get current location');
        } finally {
            setLocationLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updateData = {
                name: headquarters.name,
                latitude: parseFloat(headquarters.latitude),
                longitude: parseFloat(headquarters.longitude),
                allowed_radius_meters: parseInt(headquarters.allowed_radius_meters)
            };

            await updateHeadquarters(updateData);
            toast.success('Headquarters settings updated successfully');
        } catch (error) {
            console.error('Failed to update headquarters:', error);
            toast.error(error.response?.data?.detail || 'Failed to update headquarters settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Headquarters Location Settings</h5>
            </Card.Header>
            <Card.Body>
                <Alert variant="info">
                    <small>
                        Configure the headquarters location for attendance validation.
                        All employees must be within the specified radius to check in/out.
                    </small>
                </Alert>

                <Form onSubmit={handleSave}>
                    <Row className="mb-3">
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Headquarters Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="name"
                                    value={headquarters.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Cairo Headquarters"
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Latitude</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="any"
                                    name="latitude"
                                    value={headquarters.latitude}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 30.0500"
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Longitude</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="any"
                                    name="longitude"
                                    value={headquarters.longitude}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 31.2333"
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Allowed Radius (meters)</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="allowed_radius_meters"
                                    value={headquarters.allowed_radius_meters}
                                    onChange={handleInputChange}
                                    min="10"
                                    max="1000"
                                    required
                                />
                                <Form.Text className="text-muted">
                                    Employees must be within this distance to check in/out
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={6} className="d-flex align-items-end">
                            <Button
                                variant="outline-primary"
                                onClick={handleGetCurrentLocation}
                                disabled={locationLoading}
                                className="mb-3"
                            >
                                {locationLoading ? (
                                    <>
                                        <Spinner animation="border" size="sm" /> Getting Location...
                                    </>
                                ) : (
                                    'Use Current Location'
                                )}
                            </Button>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={saving || !headquarters.latitude || !headquarters.longitude}
                        >
                            {saving ? (
                                <>
                                    <Spinner animation="border" size="sm" /> Saving...
                                </>
                            ) : (
                                'Save Settings'
                            )}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default HeadquartersSettings;
