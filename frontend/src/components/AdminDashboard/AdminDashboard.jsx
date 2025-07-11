import React from 'react'
import StatCards from '../statCards/statCards'
import CandidateCharts from '../CandidateCharts/CandidateCharts'
import RecruitersTable from '../RecruitersTable/RecruitersTable'

const AdminDashboard = () => {
  return (
    <>
    <StatCards />
    <CandidateCharts />
    <RecruitersTable />
    </>
  )
}

export default AdminDashboard