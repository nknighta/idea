import { useState, useEffect } from 'react';
import { Octokit } from 'octokit';
import Cookies from 'js-cookie';

interface User {
    login: string;
    name: string;
    avatar_url: string;
}

interface GitHubAuthProps {
    onAuthChange: (user: User | null) => void;
}

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const AUTHORIZED_USER = 'nknighta';

export default function GitHubAuth({ onAuthChange }: GitHubAuthProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // URLからcodeパラメータを取得
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            // GitHub認証が完了した場合
            handleGitHubCallback(code);
        } else {
            // 既存のトークンをチェック
            checkExistingAuth();
        }
    }, []);

    const handleGitHubCallback = async (code: string) => {
        try {
            // GitHub Pagesでは直接トークン交換ができないため、
            // GitHub Personal Access Tokenを使用する方式に変更
            // 実際の実装では、別のサービス（Vercel Functions等）でトークン交換を行う
            
            // 一時的にPersonal Access Tokenを直接使用
            const token = prompt('GitHub Personal Access Token (read:user権限が必要):');
            if (token) {
                const octokit = new Octokit({ auth: token });
                const { data: userData } = await octokit.rest.users.getAuthenticated();
                
                if (userData.login === AUTHORIZED_USER) {
                    setUser(userData);
                    onAuthChange(userData);
                    Cookies.set('github_token', token, { expires: 7 });
                    // URLからcodeパラメータを削除
                    window.history.replaceState({}, document.title, window.location.pathname);
                } else {
                    alert('このユーザーはアクセス権限がありません。');
                }
            }
        } catch (error) {
            console.error('GitHub認証エラー:', error);
            alert('認証に失敗しました。');
        }
        setLoading(false);
    };

    const checkExistingAuth = async () => {
        const token = Cookies.get('github_token');
        if (token) {
            try {
                const octokit = new Octokit({ auth: token });
                const { data: userData } = await octokit.rest.users.getAuthenticated();
                
                if (userData.login === AUTHORIZED_USER) {
                    setUser(userData);
                    onAuthChange(userData);
                }
            } catch (error) {
                console.error('認証チェックエラー:', error);
                Cookies.remove('github_token');
            }
        }
        setLoading(false);
    };

    const handleLogin = () => {
        // GitHub Pages用の簡単な認証方式
        // Personal Access Tokenを直接入力してもらう
        const token = prompt('GitHub Personal Access Token (read:user権限が必要):');
        if (token) {
            handleTokenLogin(token);
        }
    };

    const handleTokenLogin = async (token: string) => {
        try {
            const octokit = new Octokit({ auth: token });
            const { data: userData } = await octokit.rest.users.getAuthenticated();
            
            if (userData.login === AUTHORIZED_USER) {
                setUser(userData);
                onAuthChange(userData);
                Cookies.set('github_token', token, { expires: 7 });
                alert('ログインしました！');
            } else {
                alert(`このユーザー(${userData.login})はアクセス権限がありません。`);
            }
        } catch (error) {
            console.error('認証エラー:', error);
            alert('認証に失敗しました。トークンを確認してください。');
        }
    };

    const handleLogout = () => {
        setUser(null);
        onAuthChange(null);
        Cookies.remove('github_token');
    };

    if (loading) {
        return <div>認証状態を確認中...</div>;
    }

    return (
        <div className="github-auth">
            {user ? (
                <div className="user-info">
                    <img src={user.avatar_url} alt={user.name} width="32" height="32" />
                    <span>こんにちは、{user.name || user.login}さん</span>
                    <button onClick={handleLogout}>ログアウト</button>
                </div>
            ) : (
                <div className="login-section">
                    <button onClick={handleLogin}>GitHubでログイン</button>
                    <small>
                        <br />
                        GitHub Personal Access Token (read:user権限)が必要です。
                        <br />
                        <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">
                            こちらから取得できます
                        </a>
                    </small>
                </div>
            )}
        </div>
    );
}
