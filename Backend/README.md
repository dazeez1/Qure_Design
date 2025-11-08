# Qure Healthcare Queue Management System - Backend

A comprehensive healthcare queue management system built with Node.js, Express, and MongoDB. Features real-time queue management, appointment scheduling, staff-patient communication, analytics, and more.

## Features

- **User Authentication**: JWT-based auth with role-based access control (Patient/Staff)
- **Appointment Management**: Create, edit, reschedule, and manage appointments
- **Queue Management**: Real-time queue system with FIFO logic and status tracking
- **Staff Dashboard**: Comprehensive staff interface with analytics and patient management
- **Patient Dashboard**: Patient portal with appointment and queue status
- **Messaging System**: Staff-to-patient communication with email notifications
- **Real-time Analytics**: Live charts and department heatmaps
- **Waiting Room Management**: Room assignment and occupancy tracking
- **Notification System**: In-app and email notifications
- **Feedback System**: Patient feedback collection and ratings
- **Contact System**: Contact form with auto-categorization
- **Access Code Management**: Hospital-specific access codes for staff registration

## Setup

1. Create an `.env` file (see `.env.example`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development:
   ```bash
   npm run dev
   ```
4. Run in production:
   ```bash
   node server.js
   ```

## Environment Variables

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/qure
JWT_SECRET=your-strong-secret
CORS_ORIGIN=http://localhost:5173,http://localhost:5500

# Email Configuration (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Optional: MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qure
```

## API Documentation

Base path: `/api`

**Authentication**: Use `Authorization: Bearer <token>` header for protected routes.

### Authentication

#### `POST /api/auth/register`

Register a new user (patient or staff).

**Body:**

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "password": "string",
  "role": "patient" | "staff",
  "hospitalName": "string (required for staff)",
  "accessCode": "string (required for staff)"
}
```

**Response:**

```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    /* user object */
  }
}
```

#### `POST /api/auth/login`

Login with email/phone and password.

**Body:**

```json
{
  "emailOrPhone": "string",
  "password": "string"
}
```

#### `POST /api/auth/forgot-password`

Request password reset.

**Body:**

```json
{
  "email": "string"
}
```

#### `POST /api/auth/reset-password`

Reset password with token.

**Body:**

```json
{
  "token": "string",
  "password": "string"
}
```

### Appointments

#### `POST /api/appointments` (Patient only)

Create a new appointment.

**Body:**

```json
{
  "doctor": "string",
  "specialty": "string",
  "appointmentDate": "YYYY-MM-DD",
  "appointmentTime": "HH:MM",
  "notes": "string (optional)",
  "hospitalName": "string (optional)"
}
```

#### `GET /api/appointments` (Patient only)

Get patient's appointments with filtering and pagination.

**Query Parameters:**

- `status`: Filter by status (scheduled, confirmed, completed, etc.)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

#### `GET /api/appointments/:id` (Patient only)

Get specific appointment details.

#### `PUT /api/appointments/:id` (Patient only)

Update appointment details.

#### `DELETE /api/appointments/:id` (Patient only)

Cancel an appointment.

### Staff Appointment Management

#### `GET /api/appointments/hospital/all` (Staff only)

Get all appointments for staff's hospital with filtering.

**Query Parameters:**

- `status`: Filter by status
- `department`: Filter by department
- `dateFrom`: Start date filter
- `dateTo`: End date filter
- `search`: Search by patient name
- `page`: Page number
- `limit`: Items per page

#### `PUT /api/appointments/staff/:id/status` (Staff only)

Update appointment status (accept, reschedule, complete).

**Body:**

```json
{
  "status": "accepted" | "rescheduled" | "completed" | "cancelled",
  "notes": "string (optional)"
}
```

#### `POST /api/appointments/staff/create` (Staff only)

Create appointment for patient.

#### `PUT /api/appointments/staff/:id/reschedule` (Staff only)

Reschedule appointment.

#### `PUT /api/appointments/staff/:id/edit` (Staff only)

Edit appointment and patient details.

**Body:**

```json
{
  "doctor": "string",
  "specialty": "string",
  "appointmentDate": "YYYY-MM-DD",
  "appointmentTime": "HH:MM",
  "notes": "string",
  "patientInfo": {
    "fullName": "string",
    "phoneNumber": "string",
    "email": "string",
    "dateOfBirth": "YYYY-MM-DD"
  }
}
```

### Queue Management

#### `POST /api/queues/join` (Patient only)

Join a queue.

**Body:**

```json
{
  "hospitalName": "string",
  "specialty": "string",
  "notes": "string (optional)",
  "priority": "normal" | "urgent"
}
```

#### `GET /api/queues/status` (Patient only)

Get current queue status for patient.

#### `DELETE /api/queues/leave` (Patient only)

Leave current queue.

#### `GET /api/queues/history` (Patient only)

Get queue history with pagination.

#### `GET /api/queues/hospital` (Staff only)

Get all queues for staff's hospital.

**Query Parameters:**

- `hospitalName`: Hospital name
- `specialty`: Filter by specialty

#### `POST /api/queues/call-next` (Staff only)

Call next patient in queue.

**Body:**

```json
{
  "hospitalName": "string",
  "specialty": "string"
}
```

#### `POST /api/queues/complete` (Staff only)

Mark patient as completed.

#### `POST /api/queues/assign-room` (Staff only)

Assign patient to waiting room.

**Body:**

```json
{
  "queueId": "string",
  "roomId": "string"
}
```

### Messaging System

#### `POST /api/messages/send` (Staff only)

Send message to patient.

**Body:**

```json
{
  "appointmentId": "string",
  "message": "string",
  "messageType": "general" | "reminder" | "update",
  "priority": "low" | "medium" | "high"
}
```

#### `GET /api/messages` (All users)

Get messages for user.

### Waiting Room Management

#### `GET /api/waiting-rooms` (Staff only)

Get all waiting rooms for hospital.

#### `POST /api/waiting-rooms` (Staff only)

Create new waiting room.

#### `PUT /api/waiting-rooms/:id` (Staff only)

Update waiting room details.

#### `DELETE /api/waiting-rooms/:id` (Staff only)

Delete waiting room.

### Notifications

#### `GET /api/notifications` (All users)

Get user notifications with pagination.

**Query Parameters:**

- `page`: Page number
- `limit`: Items per page
- `unreadOnly`: Filter unread only

#### `PUT /api/notifications/:id/read` (All users)

Mark notification as read.

#### `PUT /api/notifications/read-all` (All users)

Mark all notifications as read.

#### `DELETE /api/notifications/:id` (All users)

Delete notification.

#### `DELETE /api/notifications/delete-all` (All users)

Delete all notifications.

### Feedback System

#### `POST /api/feedback` (Patient only)

Submit feedback.

**Body:**

```json
{
  "appointmentId": "string",
  "rating": 1-5,
  "comment": "string (optional)"
}
```

#### `GET /api/feedback` (Staff only)

Get feedback for hospital.

### Contact System

#### `POST /api/contact` (All users)

Submit contact form.

**Body:**

```json
{
  "name": "string",
  "email": "string",
  "subject": "string",
  "message": "string",
  "category": "general" | "technical" | "complaint" | "suggestion"
}
```

### Hospital Management

#### `GET /api/hospitals` (All users)

Get list of active hospitals.

### Access Code Management

#### `GET /api/access-codes` (Staff only)

Get access codes for hospital.

#### `POST /api/access-codes/generate` (Staff only)

Generate new access code.

#### `PUT /api/access-codes/:id/revoke` (Staff only)

Revoke access code.

## Database Models

### User

- `firstName`, `lastName`, `email`, `phone`, `password`
- `role`: "patient" | "staff"
- `hospitalName` (for staff)
- `isActive`, `createdAt`, `updatedAt`

### Appointment

- `patient` (User reference)
- `doctor`, `specialty`, `appointmentDate`, `appointmentTime`
- `status`: "scheduled" | "confirmed" | "checked-in" | "in-progress" | "completed" | "cancelled" | "no-show"
- `notes`, `hospitalName`
- `createdAt`, `updatedAt`

### Queue

- `patient` (User reference)
- `hospitalName`, `specialty`, `queueNumber`
- `status`: "waiting" | "called" | "in-progress" | "completed" | "left"
- `priority`: "normal" | "urgent"
- `assignedRoom` (WaitingRoom reference)
- `joinedAt`, `calledAt`, `completedAt`

### Message

- `senderId` (User reference)
- `receiverId` (User reference)
- `appointmentId` (Appointment reference)
- `message`, `messageType`, `priority`
- `isRead`, `readAt`
- `createdAt`

### Notification

- `user` (User reference)
- `type`: Various notification types
- `title`, `message`
- `isRead`, `readAt`
- `relatedEntity`: { type, id }
- `createdAt`

### WaitingRoom

- `name`, `hospitalName`, `specialty`
- `capacity`, `currentOccupancy`
- `isActive`
- `createdAt`, `updatedAt`

### Feedback

- `patient` (User reference)
- `appointmentId` (Appointment reference)
- `rating` (1-5), `comment`
- `createdAt`

### Contact

- `name`, `email`, `subject`, `message`
- `category`, `priority`, `status`
- `createdAt`

### AccessCode

- `code`, `hospitalName`
- `isActive`, `expiresAt`
- `createdBy` (User reference)
- `createdAt`

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer with Gmail SMTP
- **Validation**: Zod schema validation
- **Security**: bcrypt for password hashing, Helmet for security headers
- **Logging**: Morgan for HTTP request logging

## Development Scripts

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production
node server.js
```

## Database Scripts

The `scripts/` directory contains essential utilities for development, testing, and maintenance:

### **Data Seeding Scripts**

#### `seed-patients.js` - **ESSENTIAL**

Creates comprehensive test data for development and demos:

- 12 patients across 6 hospitals
- Realistic queue entries and appointments
- 6 staff members (one per hospital)
- Tests staff actions (call-next, complete)

```bash
node scripts/seed-patients.js
```

#### `populate-bera-queue.js` - **VERY USEFUL**

Populates Bera Clinic with test patients:

- Creates realistic queue scenarios
- Sets up multiple specialties
- Perfect for testing queue management

```bash
node scripts/populate-bera-queue.js
```

#### `seed-waiting-rooms.js` - **VERY USEFUL**

Creates waiting room data for multiple hospitals:

- Sets up realistic room configurations
- Multiple floors and specialties
- Essential for testing waiting room features

```bash
node scripts/seed-waiting-rooms.js
```

### **Development & Testing Scripts**

#### `create-bera-staff.js`

Creates staff users specifically for Bera Clinic testing.

#### `create-more-appointments.js`

Generates additional test appointments for comprehensive testing.

#### `create-test-appointment.js`

Creates a single test appointment for quick testing.

#### `test-staff-appointments.js`

Tests staff appointment functionality and workflows.

### **Debugging & Maintenance Scripts**

#### `debug-appointments.js` - **USEFUL**

Helps troubleshoot appointment data issues:

- Shows all appointments in database
- Displays Bera Clinic specific data
- Lists staff users and their details
- Identifies data inconsistencies

```bash
node scripts/debug-appointments.js
```

#### `debug-jwt-token.js`

JWT token debugging utility for authentication issues.

#### `regenerate-staff-token.js`

Token management utility for staff authentication.

### **Script Usage Examples**

```bash
# Set up complete test environment
node scripts/seed-patients.js
node scripts/seed-waiting-rooms.js
node scripts/populate-bera-queue.js

# Debug data issues
node scripts/debug-appointments.js

# Create specific test data
node scripts/create-bera-staff.js
node scripts/create-more-appointments.js
```

### **Environment Variables for Scripts**

Scripts use the same environment variables as the main application:

- `MONGODB_URI` - Database connection
- `API_BASE_URL` - API base URL (defaults to http://localhost:4000)

### **Script Safety**

- Scripts include production environment checks
- Safe to run multiple times (handles existing data)
- Comprehensive error handling and logging
- Database connection management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
