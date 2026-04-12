# Lumia Backend

Complete healthcare management system backend built with Node.js, Express, and PostgreSQL.

## Features

- **Authentication & Authorization** - JWT-based auth with role-based access control
- **Patient Management** - Profiles, symptom tracking, health scores
- **Doctor Management** - Appointments, prescriptions, analytics
- **Appointments** - Booking, scheduling, reminders
- **Prescriptions** - Digital prescriptions with QR codes
- **AI Integration** - Symptom analysis, health risk scoring
- **Multi-language Support** - Hindi, English, and regional languages
- **DPDP Compliance** - Data protection and audit logs
- **Real-time Notifications** - WhatsApp, SMS, Email

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT
- **External**: Twilio (for WhatsApp/SMS)

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- Twilio Account (optional, for notifications)

## Installation

1. **Clone the repository**
```bash
cd Lumia-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Create database**
```bash
createdb Lumia
```

5. **Run migrations**
```bash
psql Lumia -f migrations/001_init_users.sql
psql Lumia -f migrations/002_init_patients.sql
psql Lumia -f migrations/003_init_doctors.sql
# ... run all migration files
```

6. **Seed sample data (optional)**
```bash
node seeds/seed.js
```

## Development

Start development server with live reload:
```bash
npm run dev
```

Server will run on `http://localhost:3000`

## Production

Build and run for production:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token

### Patient
- `GET /api/patient/me` - Get patient profile
- `POST /api/patient/symptoms` - Submit symptoms
- `GET /api/patient/timeline` - Get health timeline
- `GET /api/patient/health-score` - Get health risk score

### Doctor
- `GET /api/doctor/patients` - List patients
- `GET /api/doctor/appointments` - List appointments
- `POST /api/prescription/create` - Write prescription

### Admin
- `GET /api/admin/doctors-pending` - Pending doctor approvals
- `POST /api/admin/approve-doctor` - Approve doctor
- `GET /api/admin/analytics` - Platform analytics

### Appointments
- `POST /api/appointment/book` - Book appointment
- `GET /api/appointment/list` - List appointments
- `PUT /api/appointment/:id` - Update appointment

### Prescriptions
- `POST /api/prescription/create` - Create prescription
- `GET /api/prescription/:id` - Get prescription
- `GET /api/prescription/verify/:token` - Verify prescription

See [Lumia_BUILD_GUIDE.md](../Lumia_BUILD_GUIDE.md) for complete API documentation.

## Project Structure

```
Lumia-backend/
├── config/              # Configuration files
├── middleware/          # Express middleware
├── models/              # Database models
├── routes/              # API routes
├── controllers/         # Request handlers
├── services/            # Business logic
├── utils/               # Utility functions
├── migrations/          # Database migrations
├── seeds/               # Database seeds
├── tests/               # Test files
└── server.js            # Entry point
```

## Database Schema

### Users Table
- id (UUID)
- email (VARCHAR)
- password_hash (VARCHAR)
- phone (VARCHAR)
- role (VARCHAR) - 'patient', 'doctor', 'admin'
- status (VARCHAR)
- language (VARCHAR)
- created_at, updated_at (TIMESTAMP)

### Patients Table
- id (UUID)
- user_id (UUID - Foreign Key)
- first_name, last_name (VARCHAR)
- date_of_birth (DATE)
- gender, blood_group (VARCHAR)
- health_risk_score (DECIMAL)
- medical_conditions, medications, allergies (TEXT[])

### Doctors Table
- id (UUID)
- user_id (UUID - Foreign Key)
- first_name, last_name (VARCHAR)
- specialization (VARCHAR)
- mci_registration_number (VARCHAR)
- years_experience (INT)
- consultation_fee (INT)
- rating (DECIMAL)

### Appointments Table
- id (UUID)
- patient_id, doctor_id (UUID - Foreign Keys)
- appointment_date (TIMESTAMP)
- consultation_type ('online'/'offline')
- status ('scheduled'/'completed'/'cancelled')

### Prescriptions Table
- id (UUID)
- appointment_id, doctor_id, patient_id (UUID)
- prescription_data (JSONB)
- qr_code_url (VARCHAR)
- verification_token (VARCHAR)

## Environment Variables

Required variables (see `.env.example`):

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=Lumia

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your_secret_key
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Tokens are issued on login and expire after 15 minutes. Use the refresh token to get a new access token.

## Error Handling

API returns standard HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

Error response format:
```json
{
  "error": "Error message",
  "status": 400
}
```

## Testing

Run tests:
```bash
npm test
```

## Deployment

### Heroku

```bash
git push heroku main
heroku run node seeds/seed.js
```

### Docker

```bash
docker build -t Lumia-backend .
docker run -p 3000:3000 Lumia-backend
```

### Environment Setup

Set environment variables on your hosting platform (Heroku, AWS, etc.):
- DATABASE_URL
- REDIS_URL
- JWT_SECRET
- TWILIO_* (if using notifications)

## Contributing

1. Create feature branches
2. Follow existing code style
3. Add tests for new features
4. Commit with clear messages
5. Push to origin and create PR

## License

ISC

## Support

For issues and questions, create an issue on GitHub.

---

**Built with ❤️ for healthcare**

