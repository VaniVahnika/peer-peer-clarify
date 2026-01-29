const mongoose = require('mongoose');
const Roadmap = require('./models/Roadmap');
const dotenv = require('dotenv');

dotenv.config(); // Defaults to .env in current directory

// Data source: Simplified from roadmap.sh
const ROADMAPS_DATA = [
    {
        slug: 'full-stack',
        title: 'Full Stack Developer',
        description: 'Step by step guide to becoming a modern Full Stack Developer in 2025',
        nodes: [
            { id: 'frontend-basics', title: 'Frontend Basics', description: 'HTML, CSS, JavaScript fundamentals.' },
            { id: 'react', title: 'React.js', description: 'Components, Hooks, State Management.' },
            { id: 'backend-basics', title: 'Backend Basics', description: 'Node.js runtime, HTTP, APIs.' },
            { id: 'databases', title: 'Databases', description: 'Relational (PostgreSQL) vs NoSQL (MongoDB).' },
            { id: 'auth', title: 'Authentication', description: 'JWT, OAuth, Sessions, Cookies.' },
            { id: 'deployment', title: 'Deployment', description: 'CI/CD, Docker, Cloud Providers.' }
        ]
    },
    {
        slug: 'system-design',
        title: 'System Design',
        description: 'Learn how to design large-scale systems.',
        nodes: [
            { id: 'networking', title: 'Networking Basics', description: 'OSI Model, TCP/UDP, DNS, HTTP.' },
            { id: 'databases-advanced', title: 'Database Scaling', description: 'Sharding, Replication, CAP Theorem.' },
            { id: 'caching', title: 'Caching', description: 'CDN, Redis, Memcached, Cache Strategies.' },
            { id: 'messaging', title: 'Message Queues', description: 'Kafka, RabbitMQ, Event-driven architecture.' },
            { id: 'api-design', title: 'API Design', description: 'REST, GraphQL, gRPC.' }
        ]
    }
];

const seedRoadmaps = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('MongoDB Connected');

        // Clear existing (optional, or updateOne with upsert)
        await Roadmap.deleteMany({});
        console.log('Cleared existing roadmaps');

        for (const data of ROADMAPS_DATA) {
            await Roadmap.create(data);
            console.log(`Created roadmap: ${data.title}`);
        }

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedRoadmaps();
