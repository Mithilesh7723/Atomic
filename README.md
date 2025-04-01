# AtomHR - Performance Management System

A modern employee performance tracking application built with React, TypeScript, TailwindCSS, and Firebase.

## Features

- User authentication (Admin/Employee roles)
- Employee performance tracking
- Real-time feedback system
- Goal setting and tracking
- Performance metrics visualization
- Admin dashboard for performance management

## Technologies

- React 18
- TypeScript
- Firebase (Authentication, Realtime Database)
- TailwindCSS
- Vite
- React Router
- Lucide React (icons)

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase account with a project set up

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/atomhr.git
   cd atomhr
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Configure Firebase
   - Update the Firebase configuration in `src/config/firebase.ts` with your project details

4. Create admin user
   ```
   npm run init-admin
   ```
   This will create an admin user with:
   - Email: admin@atomhr.com
   - Password: admin123

5. Start the development server
   ```
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:5173`

## Usage

### Admin Login

1. Use the admin credentials:
   - Email: admin@atomhr.com
   - Password: admin123

2. As an admin, you can:
   - Add new employees
   - Review employee performance
   - Provide feedback
   - Monitor overall performance metrics

### Adding Employees

1. Log in as an admin
2. Go to the Admin Dashboard
3. Click "Add Employee"
4. Fill in the employee details
5. Submit the form

### Employee Login

1. Employees can log in with the credentials created by the admin
2. They can view their dashboard with:
   - Performance overview
   - Feedback received
   - Goals tracking
   - Metrics visualization

## Development

### Project Structure

```
/src
  /components      # Reusable UI components
  /config          # Configuration files
  /context         # React context providers
  /pages           # Main pages
  /scripts         # Utility scripts
  /services        # Firebase services
  /types           # TypeScript types
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 