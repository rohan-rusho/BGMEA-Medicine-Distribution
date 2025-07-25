# BGMEA Health Centre - Medicine Issue Portal

A comprehensive medicine distribution dashboard for BGMEA Health Centre with real-time tracking, analytics, and user management.

## 🏥 Features

### 🔐 Authentication & Security

- **User Registration & Login** with email verification
- **Role-based Access Control** (Admin, Manager, User)
- **Forgot Password** functionality
- **Secure Data Access** - Users see only their own entries (unless admin)

### 📊 Dashboard

- **Real-time Medicine Entry** with autocomplete suggestions
- **Today's Summary** with entry count and total quantities
- **Recent Entries** display with user-specific filtering
- **Online User Counter** showing active users across all branches
- **Branch Selection** (East, West, North, South)

### 📈 Analytics

- **Visual Charts** for medicine distribution
- **Top Medicines** by usage
- **Monthly Statistics** and trends
- **Branch-wise Analytics**

### 📥 Data Export

- **CSV Download** with Excel-compatible format
- **Monthly Medicine Stock** reports
- **Daily Usage Tracking** (1-31 columns)
- **Empty cells** for days with no data (clean format)

### 🌐 Real-time Features

- **Live User Tracking** - See who's online from each branch
- **Dhaka Timezone** support (UTC+6)
- **Auto-refresh** data every 30 seconds
- **Session Management** with heartbeat system

## 🏗️ Technical Stack

### Frontend

- **HTML5** with semantic structure
- **CSS3** with modern gradients and animations
- **Vanilla JavaScript** for dynamic functionality
- **Responsive Design** for all screen sizes

### Backend & Database

- **Firebase Authentication** for user management
- **Cloud Firestore** for real-time database
- **Firebase Security Rules** for data protection

### Libraries

- **Chart.js** for analytics visualizations
- **Firebase SDK v9** for web compatibility

## 📁 Project Structure

```
BGMEA/
├── index.html          # Main application file
├── dashboard.html      # Dashboard interface
├── analytics.html      # Analytics interface
├── style.css          # Application styling
├── app.js             # Authentication logic
├── dashboard.js       # Dashboard functionality
├── analytics.js       # Analytics functionality
├── assets/
│   └── logo.jpg       # BGMEA logo
└── README.md          # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for Firebase services

### Installation

1. Clone or download this repository
2. Open `index.html` in a web browser
3. Register a new account or login with existing credentials
4. Select your branch and start managing medicine distribution

### Firebase Configuration

The application is pre-configured with Firebase. For production use:

1. Create your own Firebase project
2. Update the Firebase config in `app.js`, `dashboard.js`, and `analytics.js`
3. Set up Firestore security rules for your organization

## 🏢 Branch Management

### Supported Branches

- **East Branch** - Eastern regional office
- **West Branch** - Western regional office  
- **North Branch** - Northern regional office
- **South Branch** - Southern regional office

Each branch maintains separate medicine inventories and user access.

## 📋 Medicine Database

### Pre-loaded Medicines

- A-Fenac SR 100, A-Phenicol Eye drop, Alba 400
- Alertin 10, AMX 500, Azaltic 500
- Ben-A 400, Broculyt syrup, Citrux 250
- And 25+ more common medicines with autocomplete

### Medicine Entry Features

- **Autocomplete suggestions** for faster entry
- **Quantity tracking** with validation
- **Date selection** with Dhaka timezone
- **Branch-specific** inventory management

## 🔒 Security Features

### User Roles

- **User**: Can only see their own medicine entries
- **Manager**: Can see all entries for their branch
- **Admin**: Full access to all branches and data

### Data Protection

- **Firebase Security Rules** prevent unauthorized access
- **User-specific filtering** for sensitive data
- **Session management** with automatic cleanup
- **Input validation** and sanitization

## 📊 Analytics Dashboard

### Available Charts

- **Medicine Distribution** pie/bar charts
- **Daily Usage Trends** over time
- **Top Medicines** by quantity
- **Branch Comparison** statistics

### Export Features

- **CSV Download** with Excel formatting
- **Monthly Reports** with daily breakdown
- **Medicine Stock Reports**
- **Custom date ranges**

## 🌟 Real-time Features

### Online User Tracking

- Shows total users currently online
- Updates every 30 seconds
- Session cleanup after 2 minutes of inactivity
- Branch-wise user distribution (if needed)

### Live Data Updates

- **Auto-refresh** dashboard data
- **Real-time** entry counting
- **Instant** CSV generation
- **Live** analytics updates

## 🕒 Timezone Support

All dates and times use **Dhaka Standard Time (UTC+6)**:

- Medicine entry dates
- User session tracking  
- Analytics time ranges
- CSV export timestamps

## 🚀 Performance Features

- **Optimized data loading** with dual collection support
- **Efficient queries** with proper indexing
- **Lazy loading** for large datasets
- **Caching** for frequently accessed data

## 👥 User Management

### Registration Process

1. Fill out registration form with branch selection
2. Email verification required
3. Default role assignment (User)
4. Branch-specific access setup

### User Roles & Permissions

- **Role-based data access**
- **Branch-specific filtering**
- **Admin tools** for user management
- **Security audit trails**

## 📱 Mobile Responsive

- **Touch-friendly** interface for tablets
- **Responsive design** for mobile phones
- **Optimized forms** for small screens
- **Swipe navigation** where appropriate

## 🔧 Development

### Local Development

1. Serve files through a local web server (required for Firebase)
2. Use `python -m http.server` or similar
3. Access via `http://localhost:8000`

### Customization

- Update Firebase config for your organization
- Modify medicine list in `dashboard.js`
- Customize branches in HTML forms
- Adjust timezone settings if needed

## 📄 License

This project is developed for BGMEA Health Centre. All rights reserved.

## 🤝 Support

For technical support or feature requests, contact the development team.

---

**BGMEA Health Centre - Streamlining Medicine Distribution with Modern Technology** 🏥💊📊
