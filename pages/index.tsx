import { useState } from 'react';
import GitHubAuth from '../components/GitHubAuth';
import GitHubSync from '../components/GitHubSync';
import IdeaFeed from '../components/IdeaFeed';
import { GitHubService } from '../utils/github';

interface User {
    login: string;
    name: string;
    avatar_url: string;
}

export default function Feed() {
    const [user, setUser] = useState<User | null>(null);
    const [githubService, setGithubService] = useState<GitHubService | null>(null);
    
    const handleAuthChange = (userData: User | null) => {
        setUser(userData);
    };

    const handleSyncStatusChange = (isConnected: boolean, service: GitHubService | null) => {
        setGithubService(service);
    };

    const canEdit = user?.login === 'nknighta';

    return (
        <div className="container">
            <header>
                <h1>My Idea</h1>
                <GitHubAuth onAuthChange={handleAuthChange} />
            </header>
            
            {user && (
                <div className="sync-section">
                    <GitHubSync 
                        user={user} 
                        onSyncStatusChange={handleSyncStatusChange} 
                    />
                </div>
            )}
            
            <main>
                <IdeaFeed canEdit={canEdit} githubService={githubService} />
            </main>
        </div>
    );
}