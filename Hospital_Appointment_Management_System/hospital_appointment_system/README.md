# CarePoint — Hospital Appointment Management System starter

## Important database compatibility note
The screenshots show both singular and plural tables. This starter maps to:
- `doctors(doctor_id, doctor_name, specialization, phone)`
- `patients(patient_id, patient_name, age, gender, phone)`
- `appointments(appointment_id, patient_id, doctor_id, appointment_date, appointment_time, status)`

The `appointment` singular table shown in the screenshots has a different schema. The application does not use it. Verify the column types/constraints and foreign keys before running. Hibernate is set to `ddl-auto=validate`, so it will not create or modify tables.

## Requirements
- JDK 17+
- Maven 3.9+
- MySQL 8+
- Existing `hospital_db` schema

## Run locally (Windows PowerShell)
Set credentials in the terminal before running; do not commit them to source control:
```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/hospital_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="YOUR_MYSQL_PASSWORD"
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="USE_A_LONG_UNIQUE_PASSWORD"
mvn spring-boot:run
```
Open http://localhost:8080. Doctor listing is public. Admin API uses HTTP Basic authentication and is available only to the ADMIN role. The frontend sends credentials only after the user enters them; use HTTPS in production.

## Features
- Public doctor list loaded from MySQL
- Admin login using Spring Security HTTP Basic authentication
- Admin workspace to register, view, and update patient details; book appointments; and view/update appointment status
- Patient self-service accounts are not enabled. Patient records and bookings are managed by authenticated staff.
- Admin/database credentials are configured through environment variables and must not be committed to source control.

## REST endpoints
- `GET /api/doctors` public
- `GET /api/admin/patients` admin
- `POST /api/admin/patients` admin JSON: `{"name":"Example Patient","age":32,"gender":"Other","phone":"0000000000"}`
- `PUT /api/admin/patients/{id}` admin, same JSON body as patient creation
- `GET /api/admin/appointments` admin
- `POST /api/admin/appointments` admin JSON: `{"patientId":1,"doctorId":1,"date":"2026-11-10","time":"10:30:00"}`
- `PATCH /api/admin/appointments/{id}/status` admin JSON: `{"status":"Confirmed"}`

The browser admin workspace submits patient and appointment records to these endpoints. An appointment starts with `Pending`; staff can change it to `Confirmed`, `Completed`, or `Cancelled`.

## Deployment
Deploy the Spring Boot jar to a Java 17+ host and use a managed MySQL database. Set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` as server environment variables. Use a dedicated least-privilege database account rather than the MySQL `root` account, use HTTPS, restrict database network access, and enable backups. The local `localhost` database URL will not work from a remote deployment host; change `DB_URL` to the hosted database connection string. Run database migration/rehearsal in staging first. Do not use `ddl-auto=update` on the production database.

### Deploy to Render
The repository-root `render.yaml` configures a Docker web service and points Render to `Hospital_Appointment_Management_System/hospital_appointment_system`, where the `Dockerfile` and Maven project are located. Push the latest commit to GitHub, then in Render choose **New → Blueprint** and select the repository. Before deployment, provide the requested environment variables:
- `DB_URL`: `jdbc:mysql://<host>:<port>/<database>?useSSL=true&serverTimezone=UTC` (use the JDBC URL supplied by your MySQL provider)
- `DB_USERNAME` and `DB_PASSWORD`: credentials for a dedicated application database user
- `ADMIN_USERNAME` and `ADMIN_PASSWORD`: a unique staff account and strong password

Render does not provide a managed MySQL database with this service. Provision MySQL with a provider that permits connections from Render, configure its network allowlist/TLS as required, and ensure it contains the tables and column definitions listed above. A database on your own PC (`localhost`) is not reachable from Render. Keep all passwords in Render's environment settings; do not add them to `render.yaml`, source control, or chat. The service uses Hibernate schema validation and will fail startup if the target schema does not match.
