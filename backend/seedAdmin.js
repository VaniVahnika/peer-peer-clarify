const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const fs = require('fs');
const path = require('path');

// Manually parse .env because dotenv is failing
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

const seedAdmin = async () => {
    try {
        if (!process.env.DB_URI || !process.env.DB_NAME) {
            throw new Error('DB_URI or DB_NAME not found in .env');
        }
        const mongoURI = `${process.env.DB_URI}/${process.env.DB_NAME}`;
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected for Seeding');

        const adminEmail = 'harikrishnachunduri123@gmail.com';
        const adminExists = await User.findOne({ email: adminEmail });

        if (adminExists) {
            console.log('Admin already exists.');
            // Optional: Update password if needed, but for now just exit
            process.exit();
        }

        const hashedPassword = await bcrypt.hash('Hari@2609', 12);

        const adminUser = new User({
            name: 'Hari Krishna',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            isVerified: true
        });

        await adminUser.save();
        console.log('Admin user created successfully.');
        process.exit();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
