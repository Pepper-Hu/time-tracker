const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
// Authentication endpoints: signup, login, and profile.
app.use('/api/auth', require('./routes/authRoutes'));
// Time entry endpoints: start/stop timer and CRUD for entries.
app.use('/api/timeentries', require('./routes/timeEntryRoutes'));
//app.use('/api/tasks', require('./routes/taskRoutes'));

// Export the app object for testing
if (require.main === module) {
  connectDB();
  // If the file is run directly, start the server
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
