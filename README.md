# Qure Healthcare Queue Management System

A comprehensive healthcare queue management system designed to streamline patient flow, appointment scheduling, and staff operations in healthcare facilities.

## 🏥 Overview

Qure is a full-stack web application that provides healthcare facilities with a modern, efficient queue management system. It features real-time updates, comprehensive analytics, staff-patient communication, and intuitive dashboards for both patients and healthcare staff.

## ✨ Key Features

### For Patients

- **Appointment Scheduling**: Book appointments with specific doctors and specialties
- **Queue Management**: Join virtual queues and track your position in real-time
- **Real-time Notifications**: Receive updates about appointment status and queue position
- **Patient Dashboard**: View upcoming appointments, queue status, and medical history
- **Feedback System**: Rate and provide feedback on healthcare services
- **Contact Support**: Reach out to healthcare staff with questions or concerns

### For Healthcare Staff

- **Staff Dashboard**: Comprehensive interface for managing patients and queues
- **Appointment Management**: Create, edit, reschedule, and manage patient appointments
- **Queue Control**: Call patients, manage queue flow, and assign waiting rooms
- **Patient Communication**: Send messages and notifications to patients
- **Real-time Analytics**: Live charts showing queue trends, peak hours, and department activity
- **Waiting Room Management**: Organize patients by rooms and specialties
- **Access Code System**: Secure staff registration with hospital-specific access codes
- **Settings Management**: Comprehensive hospital administration panel

### System Features

- **Real-time Updates**: Live data synchronization across all interfaces
- **Role-based Access**: Secure authentication with patient and staff roles
- **Email Notifications**: Automated email alerts for appointments and updates
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Analytics Dashboard**: Comprehensive insights into hospital operations
- **Multi-hospital Support**: Manage multiple healthcare facilities
- **Settings Management**: Complete hospital administration and configuration

## 🛠️ Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication and authorization
- **Nodemailer** - Email service
- **Zod** - Schema validation
- **bcrypt** - Password hashing
- **Helmet** - Security middleware
- **Morgan** - HTTP request logging
- **node-cron** - Scheduled tasks and automation

### Frontend

- **HTML5** - Structure
- **CSS3** - Styling with modern features
- **JavaScript (ES6+)** - Client-side logic
- **Chart.js** - Analytics and data visualization
- **Font Awesome** - Icons
- **Responsive Design** - Mobile-first approach

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Qure-Design
   ```

2. **Backend Setup**

   ```bash
   cd Backend
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the `Backend` directory:

   ```env
   PORT=4000
   MONGODB_URI=mongodb://localhost:27017/qure
   JWT_SECRET=your-strong-secret-key
   CORS_ORIGIN=http://localhost:5500,http://localhost:5173

   # Email Configuration (Gmail SMTP)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

4. **Start the Backend Server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   node server.js
   ```

5. **Frontend Setup**
   The frontend is static HTML/CSS/JS. Simply open `Frontend/public/index.html` in your browser or serve it using a local server:

   ```bash
   # Using Python
   cd Frontend/public
   python -m http.server 8000

   # Using Node.js serve
   npx serve Frontend/public
   ```

6. **Access the Application**

   - Frontend: `http://localhost:8000` (or your chosen port)
   - Backend API: `http://localhost:4000`

7. **Set Up Test Data (Optional)**
   ```bash
   cd Backend
   # Create comprehensive test data
   node scripts/seed-patients.js
   node scripts/seed-waiting-rooms.js
   node scripts/populate-bera-queue.js
   ```

## 📁 Project Structure

```
Qure-Design/
├── Backend/
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Custom middleware
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Configuration files
│   ├── scripts/            # Database seeding & testing scripts
│   ├── server.js           # Main server file
│   └── README.md           # Backend documentation
├── Frontend/
│   └── public/
│       ├── *.html          # Application pages
│       ├── *.js            # Client-side JavaScript
│       ├── *.css           # Stylesheets
│       ├── asset/          # Images and fonts
│       └── font/           # Custom fonts
└── README.md               # This file
```

## 🔧 API Documentation

The backend provides a comprehensive REST API. For detailed API documentation, see [Backend/README.md](Backend/README.md).

## 🛠️ Development Tools

### Database Scripts

The Backend includes powerful scripts for development and testing:

- **`seed-patients.js`** - Creates 12 patients, 6 staff, and test data across 6 hospitals
- **`populate-bera-queue.js`** - Populates Bera Clinic with realistic queue data
- **`seed-waiting-rooms.js`** - Sets up waiting room configurations
- **`debug-appointments.js`** - Troubleshoots appointment data issues
- **`create-test-staff.js`** - Creates multiple test staff accounts with activity tracking
- **`update-existing-staff.js`** - Updates existing staff with activity records
- **`create-bera-staff.js`** - Creates Bera Clinic staff with proper authentication

See [Backend/README.md](Backend/README.md) for complete script documentation.

### Key API Endpoints

- **Authentication**: `/api/auth/*`
- **Appointments**: `/api/appointments/*`
- **Queue Management**: `/api/queues/*`
- **Messages**: `/api/messages/*`
- **Notifications**: `/api/notifications/*`
- **Settings**: `/api/settings/*`
  - **Organization**: `/api/settings/organization` - Hospital information and configuration
  - **Departments**: `/api/settings/departments` - Department CRUD operations
  - **Staff**: `/api/settings/staff` - Staff activity and role management
  - **Notifications**: `/api/settings/notifications` - Email and notification settings
- **Analytics**: Real-time data via queue endpoints

## 👥 User Roles

### Patient

- Register and login
- Book appointments
- Join queues
- View dashboard
- Receive notifications
- Provide feedback

### Staff

- Register with access code
- Manage appointments
- Control queues
- Send messages to patients
- View analytics
- Manage waiting rooms
- Configure hospital settings

## ⚙️ Settings Management

Qure includes a comprehensive settings management system that allows healthcare administrators to configure and customize their hospital operations.

### Organization Settings

- **Hospital Information**: Configure hospital name, address, and timezone
- **Capacity Thresholds**: Set low, medium, and high capacity limits for queue management
- **Timezone Configuration**: Support for multiple timezones with automatic appointment scheduling
- **Hospital Details**: Store comprehensive hospital information including contact details

### Department Management

- **CRUD Operations**: Create, read, update, and delete hospital departments
- **Status Management**: Activate/deactivate departments with real-time visibility
- **Department Details**: Configure department names, codes, descriptions, and capacity
- **Public API**: Patients can view active departments without authentication
- **Real-time Updates**: Department changes reflect immediately across the system

### Staff & Roles Management

- **Staff Activity Tracking**: Monitor staff login/logout status in real-time
- **Active/Inactive Status**: Visual indicators showing current staff availability
- **Real-time Updates**: Staff status updates every 5 seconds automatically
- **Role Management**: Track staff roles and permissions
- **Activity History**: Monitor staff engagement and availability patterns

### Notification Settings

- **Appointment Reminders**: Automated email reminders sent 1 hour before appointments
- **Professional Email Templates**: Beautifully formatted HTML emails with hospital branding
- **Cron Job Automation**: Scheduled email sending every 30 minutes
- **Test Notifications**: Send test emails to verify notification system
- **Custom UI**: Modern popup notifications instead of browser alerts
- **Email Validation**: Comprehensive email input validation with custom modals

### Settings Features

- **Real-time Data**: All settings update in real-time across the application
- **Form Validation**: Comprehensive client and server-side validation
- **Custom UI Components**: Modern, responsive interface with loading states
- **Error Handling**: User-friendly error messages and notifications
- **Data Persistence**: All settings automatically saved and loaded
- **Multi-hospital Support**: Settings isolated per hospital for multi-tenant support

## 🔐 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation with Zod
- CORS protection
- Security headers with Helmet
- Access code system for staff registration

## 📊 Analytics & Reporting

- **Real-time Charts**: Daily trends and peak hours
- **Department Heatmaps**: Visual representation of activity
- **Queue Analytics**: Wait times and throughput
- **Patient Flow**: Track patient journey through the system
- **Staff Performance**: Monitor staff efficiency

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Responsive Layout**: Works on all device sizes
- **Dark/Light Themes**: User preference support
- **Intuitive Navigation**: Easy-to-use interface
- **Real-time Updates**: Live data without page refresh
- **Accessibility**: WCAG compliant design

## 🚀 Deployment

### Backend Deployment

1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to platforms like Heroku, Railway, or DigitalOcean
4. Set up email service (Gmail SMTP or SendGrid)

### Frontend Deployment

1. Build and optimize static files
2. Deploy to platforms like Netlify, Vercel, or GitHub Pages
3. Configure CORS settings for your domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@qure-healthcare.com or create an issue in the repository.

## 🔮 Future Enhancements

- [ ] Mobile app (React Native/Flutter)
- [ ] Video consultation integration
- [ ] AI-powered queue optimization
- [ ] Multi-language support
- [ ] Advanced reporting and analytics
- [ ] Integration with hospital management systems
- [ ] Telemedicine features
- [ ] Patient portal enhancements
- [ ] Advanced settings for operating hours and emergency contacts
- [ ] Hospital logo upload and branding customization
- [ ] Advanced staff role permissions and access control

## 🙏 Acknowledgments

- Healthcare professionals who provided feedback
- Open source community for amazing tools and libraries
- Contributors and testers

---

**Qure Healthcare Queue Management System** - Streamlining healthcare operations, one queue at a time. 🏥✨
