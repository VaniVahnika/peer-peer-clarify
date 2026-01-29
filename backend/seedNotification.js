const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const User = require('./models/User');
const fs = require('fs');
const path = require('path');

// Manually parse .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const seedNotification = async () => {
    try {
        if (!process.env.DB_URI || !process.env.DB_NAME) {
            throw new Error('DB_URI or DB_NAME not found in .env');
        }
        const mongoURI = `${process.env.DB_URI}/${process.env.DB_NAME}`;
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // Find the admin user (Hari Krishna)
        const user = await User.findOne({ email: 'harikrishnachunduri123@gmail.com' });
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        const notification = new Notification({
            recipient: user._id,
            message: 'This is a real test notification from the database!',
            type: 'success'
        });

        await notification.save();
        console.log('Notification seeded successfully.');
        process.exit();
    } catch (error) {
        console.error('Error seeding notification:', error);
        process.exit(1);
    }
};

seedNotification();
