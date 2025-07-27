# HERA: HR Management System

A comprehensive system to manage **hiring**, **tasks**, **attendance**, and **salaries** — all in one place.

---

## Overview

This system simplifies HR operations by allowing:

- **Admins** to invite HR users and assign roles.
- **HRs** to create job applications, manage interviews, and approve/reject candidates.
- **Employees** to check in/out, submit tasks, and receive feedback.

Everything from recruitment to payroll reports is handled automatically in the background.

---

## Objectives

-  Automate HR tasks and reduce manual effort.
-  Assist HRs in hiring decisions using AI-powered models.
-  Provide secure JWT-based authentication and role-based access (Admin, HR, Employee).
-  Track attendance including lateness, absence, and overtime with payroll generation.
-  Deliver role-based real-time insights via dashboards.
-  Offer chatbot support for quick HR-related queries in both Arabic and English.

---

## System Architecture

| Frontend                         | Backend                       |
|----------------------------------|-------------------------------|
| React                            | Django                        |
| React Bootstrap / Bootstrap      | Supabase (PostgreSQL)         |
| React Router                     | JWT Authentication            |
| Axios                            | RESTful APIs                  |
| Context API / Custom Hooks       | Pandas, Sklearn, OpenAI, PyPDF|
| React Skeleton, Toastify         |                               |

---

## Features
- JWT-based secure login.
- Full CRUD for Employees, HRs, Candidates, Attendance, Holidays, and Payroll.
- Search and filter functionality across key modules.
- Check-in/out with timestamp and geolocation.
- Payroll reports based on attendance metrics.
- Bilingual chatbot assistant (Arabic & English).
- Form validation and error handling.
- Responsive design for all screen sizes.
- System-wide settings for bonuses and deductions.
- Dashboards personalized by user roles.

---

## Frontend Pages
| Page	                        | Description                                       |
|-------------------------------|---------------------------------------------------|
| Login	                        | Login form for all user roles                     |
| Dashboard	                    | Role-specific real-time insights and statistics   |
| List Employees	              | View/search/filter employees, HRs, and candidates |
| Add Employee	                | Add a new employee via a form                     |
| List Attendance               |	View attendance records                           |
| Add Attendance	              | Manually add attendance entries                   |
| Check In/Out	                | Self check-in and check-out                       |
| Official Holidays	            | Manage public holiday records                     |
| Salary Reports	              | Generate and view payroll details                 |
| Chatbot	                      | Chat with a virtual HR assistant                  |

---

## Setup Instructions

### Backend (Django)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ITI-Grad-Team/HR-Management-System.git
   cd HR-Management-System/backend
   ```
2. **Set up the virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. **Install the dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Apply database migrations:**
   ```bash
   python manage.py migrate
   ```
5. **Create a superuser:**
   ```bash
   python manage.py createsuperuser
   ```
6. **Run the development server:**
   ```bash
   python manage.py runserver
   ```

### Frontend (REact)
```bash
cd HR-Management-System/frontend
npm install
npm run dev
```
---

## Team Members
- Galal El-Din Owais https://github.com/GalaluddinOwais
- Ahmed Elsabbagh https://github.com/ahmed-elsabbagh778
- Othman Ahmed https://github.com/OthmanAhmed7
- Asmaa Tarek https://github.com/asamaatarek
- Ahmed Ibrahim https://github.com/ahmed-yousef-dev
- Ahmed Hani https://github.com/ahmedhani9007
