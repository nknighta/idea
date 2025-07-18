import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // 認証状態をチェック
        checkAuthentication();
    }, []);

    const checkAuthentication = async () => {
        try {
            const token = localStorage.getItem('github_token');
            if (!token) {
                setLoading(false);
                return;
            }
           
            // トークンが有効かチェック
            const { Octokit } = await import('octokit');
            const octokit = new Octokit({ auth: token });
            const { data: userData } = await octokit.rest.users.getAuthenticated();
            
            setUser(userData);
            setLoading(false);
        } catch (error) {
            console.error('認証チェックエラー:', error);
            localStorage.removeItem('github_token');
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('github_token');
        localStorage.removeItem('github_sync_config');
        setUser(null);
        setGithubService(null);
    };

    const handleSyncStatusChange = (isConnected: boolean, service: GitHubService | null) => {
        setGithubService(service);
    };

    const handleGoToEdit = () => {
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading">
                    <p>認証状態を確認中...</p>
                </div>
            </div>
        );
    }

    const canEdit = user?.login === 'nknighta';

    return (
        <div className="container">
            <header>
                <h1>My Idea</h1>
                <div className="header-actions">
                    
                    {user ? (
                        <div className="user-section">
                            <div className="user-info">
                                <img src={user.avatar_url} alt={user.name} width="32" height="32" />
                                <span>こんにちは、{user.name || user.login}さん</span>
                            </div>
                            <button onClick={handleLogout} className="logout-button">
                                ログアウト
                            </button>
                        </div>
                    ) : (
                        <div className="guest-section">
                        </div>
                    )}
                </div>
            </header>
            
            {canEdit && (
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