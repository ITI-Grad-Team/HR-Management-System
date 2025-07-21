import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { formatText } from '../../utils/formatters';

const DailyOvertimeStatus = ({ overtimeRequest }) => {
    if (!overtimeRequest) {
        return null;
    }

    const getStatusVariant = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'rejected': return 'danger';
            case 'pending': return 'warning';
            default: return 'secondary';
        }
    };

    return (
        <Card className="mt-4 shadow-sm">
            <Card.Header className="bg-light">
                <h5 className="mb-0">Today's Overtime Claim</h5>
            </Card.Header>
            <Card.Body>
                <p><strong>Status:</strong> <Badge bg={getStatusVariant(overtimeRequest.status)}>{overtimeRequest.status}</Badge></p>
                <p><strong>Requested Hours:</strong> {overtimeRequest.requested_hours}</p>
                {overtimeRequest.status !== 'pending' && (
                    <>
                        <p><strong>Reviewed By:</strong> {formatText(overtimeRequest.reviewed_by_username, 'System')}</p>
                        <p><strong>HR Comment:</strong> {overtimeRequest.hr_comment || 'No comment'}</p>
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

export default DailyOvertimeStatus; 