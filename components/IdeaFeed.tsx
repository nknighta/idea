import { useState, useEffect } from 'react';
import { GitHubService, ideaToMarkdown, parseMarkdownToIdeas, formatDate, getTodayDate } from '../utils/github';

interface Idea {
    id: string;
    title: string;
    description: string;
    createdAt: string;
}

interface IdeaFeedProps {
    canEdit: boolean;
    githubService: GitHubService | null;
}

export default function IdeaFeed({ canEdit, githubService }: IdeaFeedProps) {
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        loadIdeas();
    }, [githubService]);

    const loadIdeas = async () => {
        if (githubService) {
            // GitHubからアイデアを読み込み
            try {
                const today = getTodayDate();
                const markdown = await githubService.getMarkdownFile(today);
                if (markdown) {
                    const githubIdeas = parseMarkdownToIdeas(markdown);
                    setIdeas(githubIdeas);
                    setLastSync(new Date());
                } else {
                    setIdeas([]);
                }
            } catch (error) {
                console.error('GitHubからの読み込みエラー:', error);
                // エラーの場合はローカルストレージから読み込み
                loadFromLocalStorage();
            }
        } else {
            // ローカルストレージから読み込み
            loadFromLocalStorage();
        }
    };

    const loadFromLocalStorage = () => {
        const savedIdeas = localStorage.getItem('ideas');
        if (savedIdeas) {
            try {
                const parsedIdeas = JSON.parse(savedIdeas);
                setIdeas(parsedIdeas);
            } catch (error) {
                console.error('LocalStorageの読み込みエラー:', error);
                setIdeas([]);
            }
        } else {
            setIdeas([]);
        }
    };

    const saveIdeas = async (newIdeas: Idea[]) => {
        console.log('saveIdeas開始:', newIdeas.length, '件');
        
        setIdeas(newIdeas);
        localStorage.setItem('ideas', JSON.stringify(newIdeas));
        console.log('LocalStorageに保存完了');
        
        // GitHubにも同期
        if (githubService) {
            console.log('GitHub同期開始');
            await syncToGitHub(newIdeas);
            console.log('GitHub同期完了');
        }
    };

    const syncToGitHub = async (ideasToSync: Idea[]) => {
        if (!githubService) return;
        
        setSyncStatus('syncing');
        try {
            const today = getTodayDate();
            const todayIdeas = ideasToSync.filter(idea => 
                formatDate(new Date(idea.createdAt)) === today
            );
            
            // 今日のアイデアがない場合は空のマークダウンファイルを作成
            let markdown = `# アイデア - ${today}\n\n`;
            if (todayIdeas.length > 0) {
                todayIdeas.forEach(idea => {
                    markdown += ideaToMarkdown(idea);
                });
            } else {
                markdown += '今日のアイデアはまだありません。\n';
            }
            
            await githubService.updateMarkdownFile(
                today,
                markdown,
                `Update ideas for ${today}`
            );
            setLastSync(new Date());
            setSyncStatus('idle');
        } catch (error) {
            console.error('GitHub同期エラー:', error);
            setSyncStatus('error');
        }
    };

    const handleManualSync = async () => {
        if (githubService) {
            await syncToGitHub(ideas);
        }
    };

    const handleAddIdea = () => {
        if (newTitle.trim() && newDescription.trim()) {
            const newIdea: Idea = {
                id: Date.now().toString(),
                title: newTitle,
                description: newDescription,
                createdAt: new Date().toISOString(),
            };
            const updatedIdeas = [newIdea, ...ideas];
            saveIdeas(updatedIdeas);
            setNewTitle('');
            setNewDescription('');
            setIsEditing(false);
        }
    };

    const handleEditIdea = (idea: Idea) => {
        setEditingIdea(idea);
        setNewTitle(idea.title);
        setNewDescription(idea.description);
        setIsEditing(true);
    };

    const handleUpdateIdea = () => {
        if (editingIdea && newTitle.trim() && newDescription.trim()) {
            const updatedIdeas = ideas.map(idea =>
                idea.id === editingIdea.id
                    ? { ...idea, title: newTitle, description: newDescription }
                    : idea
            );
            saveIdeas(updatedIdeas);
            setEditingIdea(null);
            setNewTitle('');
            setNewDescription('');
            setIsEditing(false);
        }
    };

    const handleDeleteIdea = async (id: string) => {
        console.log('削除処理開始:', id);
        console.log('削除前のアイデア数:', ideas.length);
        
        if (isDeleting) {
            console.log('削除処理中のため、処理をスキップ');
            return;
        }
        
        if (confirm('このアイデアを削除しますか？')) {
            setIsDeleting(id);
            
            try {
                const updatedIdeas = ideas.filter(idea => idea.id !== id);
                console.log('削除後のアイデア数:', updatedIdeas.length);
                
                await saveIdeas(updatedIdeas);
                console.log('削除処理完了');
            } catch (error) {
                console.error('削除処理エラー:', error);
            } finally {
                setIsDeleting(null);
            }
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingIdea(null);
        setNewTitle('');
        setNewDescription('');
    };

    return (
        <div className="idea-feed">
            <div className="feed-header">
                <h2>アイデアフィード</h2>
                {githubService && (
                    <div className="sync-info">
                        <div className="sync-status">
                            {syncStatus === 'syncing' && <span className="syncing">同期中...</span>}
                            {syncStatus === 'error' && <span className="error">同期エラー</span>}
                            {syncStatus === 'idle' && lastSync && (
                                <span className="last-sync">
                                    最終同期: {lastSync.toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                        {canEdit && (
                            <button 
                                onClick={handleManualSync}
                                disabled={syncStatus === 'syncing'}
                                className="sync-button"
                            >
                                手動同期
                            </button>
                        )}
                    </div>
                )}
            </div>
            
            {canEdit && (
                <div className="edit-section">
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="add-button">
                            新しいアイデアを追加
                        </button>
                    ) : (
                        <div className="edit-form">
                            <h3>{editingIdea ? 'アイデアを編集' : '新しいアイデア'}</h3>
                            <input
                                type="text"
                                placeholder="タイトル"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="title-input"
                            />
                            <textarea
                                placeholder="説明"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                className="description-input"
                                rows={4}
                            />
                            <div className="form-buttons">
                                <button 
                                    onClick={editingIdea ? handleUpdateIdea : handleAddIdea}
                                    className="save-button"
                                >
                                    {editingIdea ? '更新' : '追加'}
                                </button>
                                <button onClick={handleCancelEdit} className="cancel-button">
                                    キャンセル
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="ideas-list">
                {ideas.length === 0 ? (
                    <p>まだアイデアがありません。</p>
                ) : (
                    ideas.map(idea => (
                        <div key={idea.id} className="idea-card">
                            <h3>{idea.title}</h3>
                            <p>{idea.description}</p>
                            <small>作成日: {new Date(idea.createdAt).toLocaleDateString()}</small>
                            
                            {canEdit && (
                                <div className="idea-actions">
                                    <button 
                                        onClick={() => handleEditIdea(idea)}
                                        className="edit-button"
                                    >
                                        編集
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteIdea(idea.id)}
                                        disabled={isDeleting === idea.id}
                                        className="delete-button"
                                    >
                                        {isDeleting === idea.id ? '削除中...' : '削除'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
