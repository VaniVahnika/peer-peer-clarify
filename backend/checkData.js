const mongoose = require('mongoose');
const Roadmap = require('./models/Roadmap');
const dotenv = require('dotenv');

dotenv.config();

const checkData = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('Connected to DB');
        const roadmaps = await Roadmap.find({});
        console.log('Roadmaps count:', roadmaps.length);
        roadmaps.forEach(r => console.log(`- ${r.title} (${r.slug})`));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkData();
