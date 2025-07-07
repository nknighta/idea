import { useState, useEffect } from 'react';
import { GitHubService } from '../utils/github';

interface GitHubSyncProps {
    user: any;
    onSyncStatusChange: (isConnected: boolean, service: GitHubService | null) => void;
}

export default function GitHubSync({ user, onSyncStatusChange }: GitHubSyncProps) {
    const [owner, setOwner] = useState('');
    const [repo, setRepo] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isConfiguring, setIsConfiguring] = useState(false);
    const [githubService, setGithubService] = useState<GitHubService | null>(null);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'error'>('idle');

    useEffect(() => {
        // 設定を読み込み
        const savedConfig = localStorage.getItem('github_sync_config');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                setOwner(config.owner);
                setRepo(config.repo);
                
                if (user?.login) {
                    // 保存された設定で接続をテスト
                    testConnection(config.owner, config.repo);
                }
            } catch (error) {
                console.error('設定の読み込みエラー:', error);
            }
        }
    }, [user]);

    const testConnection = async (ownerName: string, repoName: string) => {
        if (!user?.login) return;
        
        setStatus('connecting');
        try {
            const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN || localStorage.getItem('github_token');
            if (!token) {
                alert('GitHub Personal Access Tokenが必要です。設定を確認してください。');
                setStatus('error');
                setIsConnected(false);
                onSyncStatusChange(false, null);
                return;
            }

            const service = new GitHubService({
                owner: ownerName,
                repo: repoName,
                token: token,
            });

            const repoExists = await service.checkRepository();
            if (repoExists) {
                setGithubService(service);
                setIsConnected(true);
                onSyncStatusChange(true, service);
                setStatus('idle');
            } else {
                throw new Error('リポジトリが見つからないか、アクセス権限がありません');
            }
        } catch (error) {
            console.error('接続テストエラー:', error);
            setStatus('error');
            setIsConnected(false);
            onSyncStatusChange(false, null);
        }
    };

    const handleConnect = async () => {
        if (!owner.trim() || !repo.trim()) {
            alert('オーナー名とリポジトリ名を入力してください');
            return;
        }

        const config = { owner: owner.trim(), repo: repo.trim() };
        localStorage.setItem('github_sync_config', JSON.stringify(config));
        
        await testConnection(config.owner, config.repo);
        setIsConfiguring(false);
    };

    const handleDisconnect = () => {
        setIsConnected(false);
        setGithubService(null);
        onSyncStatusChange(false, null);
        localStorage.removeItem('github_sync_config');
    };

    if (!user) {
        return (
            <div className="github-sync">
                <p>GitHubにログインするとリポジトリ同期が利用できます</p>
            </div>
        );
    }

    return (
        <div className="github-sync">
            <h3>GitHub同期設定</h3>
            
            {!isConnected ? (
                <div className="sync-config">
                    {!isConfiguring ? (
                        <div>
                            <p>アイデアをGitHubリポジトリに同期しましょう</p>
                            <button onClick={() => setIsConfiguring(true)} className="config-button">
                                リポジトリを設定
                            </button>
                        </div>
                    ) : (
                        <div className="config-form">
                            <div className="form-group">
                                <label>オーナー名:</label>
                                <input
                                    type="text"
                                    value={owner}
                                    onChange={(e) => setOwner(e.target.value)}
                                    placeholder="GitHub username"
                                    className="config-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>リポジトリ名:</label>
                                <input
                                    type="text"
                                    value={repo}
                                    onChange={(e) => setRepo(e.target.value)}
                                    placeholder="repository name"
                                    className="config-input"
                                />
                            </div>
                            <div className="form-buttons">
                                <button 
                                    onClick={handleConnect}
                                    disabled={status === 'connecting'}
                                    className="connect-button"
                                >
                                    {status === 'connecting' ? '接続中...' : '接続'}
                                </button>
                                <button 
                                    onClick={() => setIsConfiguring(false)}
                                    className="cancel-button"
                                >
                                    キャンセル
                                </button>
                            </div>
                            {status === 'error' && (
                                <p className="error-message">
                                    接続に失敗しました。リポジトリ名とアクセス権限を確認してください。
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="connected-status">
                    <div className="status-info">
                        <span className="status-indicator">✓</span>
                        <span>接続済み: {owner}/{repo}</span>
                    </div>
                    <button onClick={handleDisconnect} className="disconnect-button">
                        切断
                    </button>
                </div>
            )}
        </div>
    );
}
