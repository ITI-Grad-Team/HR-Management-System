import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BioCard from './BioCard';

export default function ProfileContainer() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/view-self/')
      .then(res => {
        setProfile(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load profile.');
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="spinner-container">
      <div className="spinner"></div>
    </div>
  );
  if (error) return <div>{error}</div>; 
  if (!profile) return null;

  // Map backend response to BioCard props
  const getBioCardProps = () => {
    const { basicinfo, role: userRole } = profile;
    
    // Get role-specific data
    const roleData = profile[userRole] || {};
    
    return {
      name: basicinfo?.username || 'Unknown',
      role: userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'Unknown',
      email: profile.user?.username || 'No email', // Using username as email since email field doesn't exist
      phone: basicinfo?.phone || 'No phone',
      avatar: basicinfo?.profile_image || '/default-avatar.png',
      department: roleData?.position?.name || 'No department', // For employees, position acts as department
      location: roleData?.region?.name || 'No location', // For employees, region acts as location
      bio: `Role: ${userRole}`, // Simple bio since no bio field exists
      status: roleData?.interview_state || null, // For candidates/employees
    };
  };

  return (
    <BioCard {...getBioCardProps()} />
  );
}