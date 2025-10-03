# YuktiManthan 🚀

YuktiManthan is an intelligent job matching platform that leverages AI to connect talented candidates with the right companies. The platform provides seamless resume analysis, company recommendations, and job matching services.

## ✨ Features

### For Candidates
- **Smart Resume Upload**: Upload your resume and get instant AI-powered analysis
- **Intelligent Company Recommendations**: Get personalized company suggestions based on your skills
- **Enhanced Matching**: Advanced AI algorithms for better job-candidate matching
- **Skill Analysis**: Comprehensive analysis of your technical and soft skills

### For Companies
- **Job Posting Dashboard**: Easy-to-use interface for posting and managing job listings
- **Enhanced Job Management**: Advanced features for better job descriptions and requirements
- **Candidate Matching**: AI-powered candidate recommendations for your job postings
- **Company Profile Management**: Complete your company profile for better visibility

### Admin Features
- **User Management**: Comprehensive admin dashboard for managing users
- **Role-based Access**: Secure role-based authentication system
- **Sample Data Generation**: Tools for testing and development

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.5.2** - React framework for production
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Motion/Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icons
- **Radix UI** - Accessible UI components

### Backend & Services
- **Next.js API Routes** - Serverless backend functions
- **Supabase** - Database and authentication
- **Clerk** - User authentication and management
- **Python AI Service** - AI/ML processing service

### AI & Document Processing
- **@xenova/transformers** - Client-side AI models
- **Mammoth** - Word document processing
- **PDF processing libraries** - Resume parsing capabilities
- **Canvas** - Document rendering

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Python 3.8+ (for AI service)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd yuktimanthan
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required environment variables:
   - Supabase credentials
   - Clerk authentication keys
   - Other service API keys

4. **Set up Python AI Service**
   ```bash
   cd python-ai-service
   pip install -r requirements.txt
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Start the Python AI service**
   ```bash
   cd python-ai-service
   chmod +x start.sh
   ./start.sh
   ```

The application will be available at `http://localhost:3001`

## 📁 Project Structure

```
yuktimanthan/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth-redirect/     # Auth handling
│   ├── dashboard/         # User dashboards
│   └── signin/            # Authentication pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── Navbar.tsx        # Navigation components
│   └── ...
├── lib/                   # Utility libraries
│   ├── ai.ts             # AI service integration
│   ├── auth.ts           # Authentication utilities
│   ├── supabase.ts       # Database client
│   └── ...
├── python-ai-service/     # Python AI microservice
├── public/               # Static assets
└── ...
```

## 🔐 Authentication

YuktiManthan uses Clerk for authentication with support for:
- Email/password authentication
- Social login (SSO)
- Role-based access control
- Secure session management

## 🎨 UI/UX Features

- **Responsive Design**: Works seamlessly on all device sizes
- **Smooth Animations**: Enhanced user experience with motion animations
- **Modern UI**: Clean and intuitive interface
- **Accessibility**: Built with accessibility best practices
- **Dark/Light Mode Support**: Adaptive theme system

## 🤖 AI Features

- **Resume Parsing**: Intelligent extraction of skills and experience
- **Company Matching**: AI-powered job recommendations
- **Skill Analysis**: Comprehensive skill assessment
- **Enhanced Matching**: Advanced algorithms for better job-candidate fit

## 📊 API Routes

### Candidate APIs
- `POST /api/candidate/upload-resume` - Upload and parse resume
- `POST /api/candidate/upload-resume-enhanced` - Enhanced resume processing
- `GET /api/candidates/recommend-companies` - Get company recommendations

### Company APIs
- `GET /api/company/jobs` - Fetch company job listings
- `POST /api/company/jobs-enhanced` - Advanced job posting

### Admin APIs
- `PUT /api/admin/update-users` - User management
- `POST /api/create-sample-data` - Generate test data

## 🧪 Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

Built with ❤️ by the YuktiManthan team for creating better job matching experiences.

## 🙏 Acknowledgments

- Thanks to all the open-source libraries that made this project possible
- Special recognition to the AI/ML community for advancing job matching technology
- Appreciation for the design inspiration from modern web applications

---

For more information, please contact the development team or check out our documentation.