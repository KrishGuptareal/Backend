# Professional Video Hosting Backend

A production-ready backend built with the MERN stack (Node.js, Express, MongoDB) that mimics core functionalities of platforms like YouTube. It features secure authentication, media handling via Cloudinary, and complex data relations for a social media-like experience.

## 🚀 Features

- **User Management**: Secure registration/login with JWT, avatar/cover image uploads, profile management, and watch history.
- **Video Control**: Full CRUD operations for videos, including Cloudinary integration for storage and automatic duration extraction.
- **Social Interactions**: Robust Like, Comment, and Tweet systems with nested data lookups.
- **Subscriptions**: Real-time subscriber counting and channel subscription logic.
- **Playlists**: Create and manage private/public playlists with video ownership protection.
- **Dashboard**: Advanced MongoDB aggregation pipelines to calculate total views, likes, and subscriber stats.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **Media Storage**: Cloudinary (via Multer)
- **Security**: JWT (Access & Refresh Tokens) + Bcrypt
- **Utility**: `mongoose-aggregate-paginate-v2` for high-performance data listing.

## 🔐 Security Key Points

- **Resource Ownership**: All write operations (Update/Delete) strictly verify the owner’s ID before committing.
- **Protected Routes**: Critical paths are guarded by a custom JWT verification middleware.
- **Data Integrity**: Input validation using `isValidObjectId` to prevent database injection/crashes.
- **Safe Environment**: Sensitive keys are managed via `.env` (kept out of version control).

## ⚙️ How to Setup

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Configure Environment**: 
   - Create a `.env` file based on the `.env.sample` provided.
   - Enter your MongoDB URI, Cloudinary credentials, and JWT secrets.
4. **Run the server**: `npm run dev`

## 🛠️ Folder Structure
- `src/controllers`: Business logic for all modules.
- `src/models`: Database schemas for Users, Videos, Playlists, etc.
- `src/routes`: API endpoint definitions.
- `src/middlewares`: Security and file-handling logic.
- `src/utils`: Reusable helpers for API responses and errors.
