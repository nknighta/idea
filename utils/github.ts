import { Octokit } from 'octokit';

export interface GitHubConfig {
    owner: string;
    repo: string;
    token: string;
}

export class GitHubService {
    private octokit: Octokit;
    private config: GitHubConfig;

    constructor(config: GitHubConfig) {
        this.config = config;
        this.octokit = new Octokit({ auth: config.token });
    }

    // マークダウンファイルの内容を取得
    async getMarkdownFile(date: string): Promise<string | null> {
        try {
            const path = `ideas/${date}.md`;
            const response = await this.octokit.rest.repos.getContent({
                owner: this.config.owner,
                repo: this.config.repo,
                path: path,
            });

            if ('content' in response.data) {
                return Buffer.from(response.data.content, 'base64').toString('utf-8');
            }
            return null;
        } catch (error: any) {
            if (error.status === 404) {
                return null; // ファイルが存在しない
            }
            throw error;
        }
    }

    // マークダウンファイルを更新または作成
    async updateMarkdownFile(date: string, content: string, message: string): Promise<void> {
        try {
            const path = `ideas/${date}.md`;
            
            // 既存ファイルのSHAを取得
            let sha: string | undefined;
            try {
                const response = await this.octokit.rest.repos.getContent({
                    owner: this.config.owner,
                    repo: this.config.repo,
                    path: path,
                });
                
                if ('sha' in response.data) {
                    sha = response.data.sha;
                }
            } catch (error: any) {
                if (error.status !== 404) {
                    throw error;
                }
            }

            // ファイルを更新または作成
            await this.octokit.rest.repos.createOrUpdateFileContents({
                owner: this.config.owner,
                repo: this.config.repo,
                path: path,
                message: message,
                content: Buffer.from(content, 'utf-8').toString('base64'),
                sha: sha,
            });
        } catch (error) {
            console.error('GitHub API Error:', error);
            throw error;
        }
    }

    // リポジトリの存在確認
    async checkRepository(): Promise<boolean> {
        try {
            await this.octokit.rest.repos.get({
                owner: this.config.owner,
                repo: this.config.repo,
            });
            return true;
        } catch (error) {
            return false;
        }
    }
}

// アイデアをマークダウン形式に変換
export function ideaToMarkdown(idea: any): string {
    return `## ${idea.title}

${idea.description}

*作成日: ${new Date(idea.createdAt).toLocaleDateString('ja-JP')}*

---

`;
}

// マークダウンからアイデアを解析
export function parseMarkdownToIdeas(markdown: string): any[] {
    const ideas: any[] = [];
    const sections = markdown.split('---').filter(section => section.trim());
    
    sections.forEach(section => {
        const lines = section.trim().split('\n');
        if (lines.length < 3) return;
        
        const titleLine = lines.find(line => line.startsWith('## '));
        if (!titleLine) return;
        
        const title = titleLine.replace('## ', '').trim();
        const dateMatch = section.match(/\*作成日: ([^*]+)\*/);
        
        if (dateMatch) {
            const description = lines
                .slice(1, -3) // タイトル行と作成日行を除外
                .join('\n')
                .trim();
            
            ideas.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                title,
                description,
                createdAt: new Date(dateMatch[1]).toISOString(),
            });
        }
    });
    
    return ideas;
}

// 日付のフォーマット (YYYY-MM-DD)
export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

// 今日の日付を取得
export function getTodayDate(): string {
    return formatDate(new Date());
}
