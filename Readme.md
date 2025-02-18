# Super Chat App - Backend

This repository contains the backend services for the Super Chat App, a real-time messaging platform designed to facilitate seamless communication between users.

## Features

- **Email Sending**: Supports sending emails for notifications and user verification.
- **Real-time Messaging**: Supports instant messaging between users with low latency.
- **User Authentication**: Secure user registration and login functionalities.
- **Scalability**: Built to handle a large number of concurrent connections efficiently.

## Technologies Used

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web framework for Node.js.
- **Socket.io**: Enables real-time, bidirectional communication.
- **TypeScript**: Superset of JavaScript that adds static typing.

## Getting Started

### Prerequisites

- Node.js (from 16)
- npm (from 8)
- Docker (if using Docker for installation)

### Installation

#### Using npm

1. **Clone the repository**:

   ```bash
   git clone https://github.com/oleksandr-vatamaniuk/super-chat-be.git
   cd super-chat-be
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:

   Create a `.env` file in the root directory and add the necessary environment variables:

   ```env
   PORT=3000
   DATABASE_URL=your_database_url
   JWT_SECRET=your_secret_key
   ```

4. **Run the application in development mode**:

   ```bash
   npm run dev
   ```

   Or use Docker:

   ```bash
   docker build -f dev.Dockerfile -t super-chat-dev .
   docker run -p 8000:8000 super-chat-dev
   ```

5. **Run the application in production mode**:

   ```bash
   npm run build
   npm start
   ```

   Or use Docker:

   ```bash
   docker build -f prod.Dockerfile -t super-chat-prod .
   docker run -p 8000:8000 super-chat-prod
   ```

## Folder Structure

```
 super-chat-be/
 ├── dev.Dockerfile          # Docker configuration for dev build
 ├── prod.Dockerfile         # Docker configuration for dev prod build
 ├── eslint.config.mjs       # ESLint configuration
 ├── package.json            # Project dependencies and scripts
 ├── tsconfig.json           # TypeScript configuration
 ├── .dockerignore           # Docker ignore file
 ├── .prettierignore         # Prettier ignore file
 ├── .prettierrc             # Prettier configuration
 ├── src/
 │   ├── app.ts              # Main Express app file
 │   ├── controllers/        # Handles request logic
 │   │   ├── authController.ts
 │   │   ├── chatController.ts
 │   │   ├── messageController.ts
 │   │   └── userController.ts
 │   ├── db/
 │   │   └── connectDB.ts    # Database connection setup
 │   ├── email/              # Email sending functionality
 │   │   ├── sendEmail.ts
 │   │   └── templates/
 │   │       ├── resetPasswordTemplate.ts
 │   │       └── signUpTemplate.ts
 │   ├── errors/             # Custom error classes
 │   │   ├── bad-request.ts
 │   │   ├── custom-api.ts
 │   │   ├── index.ts
 │   │   ├── not-found.ts
 │   │   └── unauthenticated.ts
 │   ├── middlewares/        # Middleware functions
 │   │   ├── error-handler.ts
 │   │   ├── isAuth.ts
 │   │   ├── not-found.ts
 │   │   └── upload.ts
 │   ├── models/             # Database models and schemas
 │   │   ├── Chat.ts
 │   │   ├── Message.ts
 │   │   └── User.ts
 │   ├── routes/             # API routes definitions
 │   │   ├── authRouter.ts
 │   │   ├── chatRouter.ts
 │   │   ├── messageRouter.ts
 │   │   └── userRoutes.ts
 │   ├── socket/             # Socket.io event handling
 │   │   └── socket.ts
 │   ├── types/              # TypeScript types
 │   │   └── express/
 │   │       └── index.d.ts
 │   └── utils/              # Utility functions
 │       ├── createHash.ts
 │       ├── jwt.ts
 │       └── toQueryString.ts
 ├── .github/
 │   └── workflows/
 │       └── main-pipeline.yml # CI/CD pipeline configuration
 ├── .husky/
 │   └── pre-commit          # Husky pre-commit hooks
 ├── README.md               # Project documentation
```

## Contributing

Contributions are welcome! Please fork this repository and submit a pull request for any features, bug fixes, or enhancements.



