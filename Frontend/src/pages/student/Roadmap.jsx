import { useState } from 'react';
import { CheckCircle, Circle, Map, ChevronRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import './Roadmap.css';

const MOCK_ROADMAPS = [
    { id: 'fullstack', name: 'Full Stack Development', progress: 45 },
    { id: 'dsa', name: 'Data Structures & Algorithms', progress: 10 },
    { id: 'system-design', name: 'System Design', progress: 0 },
];

const FULLSTACK_MODULES = [
    {
        id: 1,
        title: 'Frontend Fundamentals',
        completed: true,
        topics: ['HTML5 Semantic Structure', 'CSS3 Flexbox & Grid', 'JavaScript ES6+ Features', 'DOM Manipulation']
    },
    {
        id: 2,
        title: 'React.js Mastery',
        completed: true,
        topics: ['Components & Props', 'Hooks (useState, useEffect)', 'Context API', 'Routing']
    },
    {
        id: 3,
        title: 'Advanced State Management',
        completed: true,
        topics: ['Redux Toolkit', 'Async Thunks', 'Performance Optimization']
    },
    {
        id: 4,
        title: 'Backend Basics (Node.js)',
        completed: true,
        topics: ['Node.js Runtime', 'Express.js Setup', 'REST API Design']
    },
    {
        id: 5,
        title: 'Database Design',
        completed: false,
        current: true,
        topics: ['SQL vs NoSQL', 'PostgreSQL Basics', 'Prisma ORM', 'Database Normalization']
    },
    {
        id: 6,
        title: 'Authentication & Security',
        completed: false,
        topics: ['JWT Strategy', 'OAuth2', 'Password Hashing']
    }
];

const Roadmap = () => {
    const [selectedRoadmap, setSelectedRoadmap] = useState('fullstack');

    return (
        <div className="roadmap-container">
            <div className="roadmap-header">
                <div>
                    <h1 className="page-title">Learning Roadmap</h1>
                    <p className="page-subtitle">Track your journey and master new skills</p>
                </div>
                <div className="roadmap-actions">
                    <select
                        className="roadmap-select"
                        value={selectedRoadmap}
                        onChange={(e) => setSelectedRoadmap(e.target.value)}
                    >
                        {MOCK_ROADMAPS.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>

                </div>
            </div>

            <div className="roadmap-progress-card-wrapper">
                <Card className="overall-progress-card">
                    <div className="progress-info">
                        <div className="progress-label">Overall Progress</div>
                        <div className="progress-percentage">45%</div>
                    </div>
                    <div className="main-progress-bar-bg">
                        <div className="main-progress-bar-fill" style={{ width: '45%' }}></div>
                    </div>
                    <p className="progress-motivation">You are doing great! Keep up the momentum.</p>
                </Card>
            </div>

            <div className="roadmap-pills">
                {FULLSTACK_MODULES.map((module, index) => (
                    <div key={module.id} className="roadmap-timeline-item">
                        <div className="timeline-connector">
                            <div className={`timeline-line ${index === FULLSTACK_MODULES.length - 1 ? 'last' : ''}`}></div>
                            <div className={`timeline-dot ${module.completed ? 'completed' : module.current ? 'current' : ''}`}>
                                {module.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                            </div>
                        </div>

                        <Card className={`module-card ${module.current ? 'current-module' : ''} ${module.completed ? 'completed-module' : ''}`}>
                            <div className="module-header">
                                <h3 className="module-title">{module.title}</h3>
                                {module.completed && <Badge variant="success">Completed</Badge>}
                                {module.current && <Badge variant="active">In Progress</Badge>}
                                {!module.completed && !module.current && <Badge variant="default">Locked</Badge>}
                            </div>

                            <ul className="module-topics">
                                {module.topics.map(topic => (
                                    <li key={topic} className="topic-item">
                                        <ChevronRight size={14} className="topic-icon" />
                                        {topic}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Roadmap;
