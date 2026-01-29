require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjust path if needed
const connectDB = require('./db');

const seedInstructor = async () => {
    try {
        await connectDB();

        const email = 'testinstructor@example.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if exists
        let user = await User.findOne({ email });

        if (user) {
            console.log('Instructor already exists. Updating...');
            user.role = 'instructor';
            user.isVerified = true;
            user.password = hashedPassword;
            user.statusForSession = 'online'; // Ensure allowed value
            await user.save();
        } else {
            console.log('Creating new instructor...');
            user = await User.create({
                name: 'Test Instructor',
                email,
                password: hashedPassword,
                role: 'instructor',
                isVerified: true,
                domains: ['React.js', 'Full Stack Development'],
                statusForSession: 'online'
            });
        }

        console.log('Instructor seeded successfully:');
        console.log('Email:', email);
        console.log('Password:', password);
        process.exit();

    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedInstructor();
