const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const SessionRequest = require('./models/SessionRequest');
const User = require('./models/User');

const run = async () => {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const requests = await SessionRequest.find()
            .populate('studentId', 'name email')
            .sort({ requestedAt: -1 })
            .limit(5);

        const fs = require('fs');

        const output = [];
        output.push(`Found ${requests.length} requests.`);

        requests.forEach(r => {
            output.push(`Request ID: ${r._id}`);
            output.push(`Student Field: ${JSON.stringify(r.studentId, null, 2)}`);
            output.push("---");
        });

        fs.writeFileSync('debug_output.txt', output.join('\n'));
        console.log("Done writing to file.");

    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
