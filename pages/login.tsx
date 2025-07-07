import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import GitHubAuth from '../components/GitHubAuth';
import GitHubSync from '../components/GitHubSync';
import IdeaFeed from '../components/IdeaFeed';
import { GitHubService } from '../utils/github';

interface User {
    login: string;
    name: string;
    avatar_url: string;
}

export default function EditPage() {
    const [user, setUser] = useState<User | null>(null);
    const [githubService, setGithubService] = useState<GitHubService | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuthentication();
    }, []);

    const checkAuthentication = async () => {
        try {
            const token = localStorage.getItem('github_token');
            if (!token) {
                setLoading(false);
                return;
            }
           
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

    const handleAuthChange = (userData: User | null) => {
        setUser(userData);
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

    const handleBackToFeed = () => {
        router.push('/');
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
                <h1>My Idea - 編集ページ</h1>
                <div className="edit-header-actions">
                    <button onClick={handleBackToFeed} className="back-to-feed-button">
                        フィードに戻る
                    </button>
                    {user ? (
                        <div className="user-section">
                            <div className="user-info">
                                <img src={user.avatar_url} alt={user.name} width="32" height="32" />
                                <span>{user.name || user.login}</span>
                            </div>
                            <button onClick={handleLogout} className="logout-button">
                                ログアウト
                            </button>
                        </div>
                    ) : (
                        <div className="auth-section">
                            <GitHubAuth onAuthChange={handleAuthChange} />
                        </div>
                    )}
                </div>
            </header>

            {!user ? (
                <div className="login-prompt">
                    <div className="login-card">
                        <h2>編集機能を利用するにはログインが必要です</h2>
                        <p>nknightaユーザーのみアイデアの編集とGitHub同期が可能です。</p>
                        <div className="login-content">
                            <GitHubAuth onAuthChange={handleAuthChange} />
                        </div>
                    </div>
                </div>
            ) : !canEdit ? (
                <div className="no-permission">
                    <div className="no-permission-card">
                        <h2>編集権限がありません</h2>
                        <p>申し訳ございません。{user.login}さんには編集権限がありません。</p>
                        <p>nknightaユーザーのみアイデアの編集が可能です。</p>
                        <button onClick={handleBackToFeed} className="back-button">
                            フィードを見る
                        </button>
                    </div>
                </div>
            ) : (
                <div className="edit-content">
                    <div className="sync-section">
                        <GitHubSync 
                            user={user} 
                            onSyncStatusChange={handleSyncStatusChange} 
                        />
                    </div>
                    
                    <main>
                        <IdeaFeed canEdit={canEdit} githubService={githubService} />
                    </main>
                </div>
            )}
        </div>
    );
}
