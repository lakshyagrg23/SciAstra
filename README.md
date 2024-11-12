# SciAstra - Academic & Research Preparation Platform

SciAstra is a web application designed to help students prepare for admissions to prestigious research institutions like IISc, IISER, NISER, and ISI. The platform offers a range of courses and blog posts that provide guidance and resources to aspiring researchers.

## Project Demo Video

[![Project Demo Video on YouTube](demo/thumbnail.png)](https://youtu.be/IXwHN-gb2Zg)

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Usage](#usage)
- [Folder Structure](#folder-structure)
- [License](#license)

---

## Features

- **Course Management**: Users can browse through courses, view discounted prices, and enroll.
- **Two-Step Payment Verification**: A secure two-step verification process ensures reliable course payments.
- **Blog Management**: Admins can add, edit, schedule, and delete blog posts. Users can read and explore blog articles.
- **User Authentication & Role-Based Access**: Separate login for admins and users, with restricted access based on roles.
- **Responsive Design**: Optimized UI for seamless usage on mobile, tablet, and desktop devices.

---

## Tech Stack

- **Frontend**: HTML, CSS (Bootstrap, Tailwind CSS), JavaScript, EJS
- **Backend**: Node.js, Express
- **Database**: MySQL
- **Authentication**: bcrypt for password hashing
- **Payments**: Mock Razorpay integration for demonstration (customizable for actual gateways)

---

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/sciastra.git
   cd sciastra

2. **Install Dependencies**:
   ```bash
   npm install

3. **Configure Environment Variables**:
   Create a .env file in the root directory and add the following:
   ```plaintext
    PORT=3000
    DB_HOST=your_database_host
    DB_USER=your_database_username
    DB_PASSWORD=your_database_password
    DB_NAME=your_database_name
    SECRET_KEY=your_secret_key

4. **Run the Application**:
    ```bash
    npm start

---

## Environment Variables

To run this project, you’ll need to add the following environment variables in your `.env` file:

- `PORT`: The port number the app will run on (e.g., 3000).
- `DB_HOST`: Database host (usually `localhost` for local setup).
- `DB_USER`: Your MySQL username.
- `DB_PASSWORD`: Your MySQL password.
- `DB_NAME`: The name of your MySQL database.
- `SECRET_KEY`: A secret key for session management.

---

## Database Setup

1. **Create Database**: 
   Create a new database in MySQL for the project.

2. **Run the SQL Script**:  
   Use the `schema.sql` file provided to set up the database tables and sample data:

   ```bash
   mysql -u [username] -p [database_name] < schema.sql

3. **Connect Database**:
   Update the `.env` file with your database credentials as mentioned in the [Environment Variables](#environment-variables) section.

---

## Usage

### Admin Dashboard
- Admins can manage blog posts, create new courses, view transaction history, and monitor user enrollments.
- Access the dashboard by logging in as an admin through the `/admin-login` route.

### Course Purchase Flow
1. Users browse available courses on the platform.
2. After selecting a course, users proceed to a mock two-step payment verification.
3. A mock payment gateway is shown, allowing users to confirm their transaction and enroll in a course.

### Blog Section
- Users can read blog posts related to admission guidance, preparation tips, and research institute information.
- Admins can create, edit, and schedule posts for publication.


## Folder Structure

```bash
sciastra/
├── public/                # Static files (CSS, images)
├── views/                 # EJS templates for frontend rendering
├── routes/                # Express route handlers
├── models/                # Database models (if applicable)
├── controllers/           # Controller files for business logic
├── .env                   # Environment configuration
├── app.js                 # Main server file
├── queries.sql             # Database setup script
└── README.md              # Project documentation
```

---

## License
This project is licensed under the MIT License.
