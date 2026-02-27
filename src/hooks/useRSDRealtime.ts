import { useEffect, useState } from 'react';
import { useStore } from '../store';

interface RSDComment {
  id: string;
  github_comment_id: number;
  pr_number: number;
  pr_title: string;
  repo: string;
  author: string;
  avatar_url: string;
  file_path: string;
  line_number: number;
  original_text: string;
  sanitized_text: string;
  action_items: string[];
  sentiment: 'critical' | 'neutral' | 'positive' | 'mixed';
  safety_score: number;
  created_at: string;
  is_read: boolean;
}

interface PullRequest {
  id: string;
  number: number;
  title: string;
  repo: string;
  state: 'open' | 'closed' | 'merged';
  commentCount: number;
  unreadCount: number;
  lastActivity: string;
  safetyScore: number;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function useRSDRealtime() {
  const { comments, setPRs, addComment, markRead } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial data from backend
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${BACKEND_URL}/api/rsd/comments`);
        if (!res.ok) throw new Error('Failed to fetch comments');
        
        const data: RSDComment[] = await res.json();
        
        // Group comments into PRs
        const prMap = new Map<string, PullRequest>();
        
        data.forEach((comment) => {
          const prId = `pr-${comment.repo}-${comment.pr_number}`;
          if (!prMap.has(prId)) {
            prMap.set(prId, {
              id: prId,
              number: comment.pr_number,
              title: comment.pr_title,
              repo: comment.repo,
              state: 'open',
              commentCount: 0,
              unreadCount: 0,
              lastActivity: 'Just now',
              safetyScore: comment.safety_score || 75,
            });
          }
          
          const pr = prMap.get(prId)!;
          pr.commentCount++;
          if (!comment.is_read) pr.unreadCount++;
        });

        setPRs(Array.from(prMap.values()));
        
        // Add comments to store
        data.forEach((c) => {
          addComment({
            id: c.id,
            prId: `pr-${c.repo}-${c.pr_number}`,
            prTitle: c.pr_title,
            originalText: c.original_text,
            sanitizedText: c.sanitized_text,
            actionItems: c.action_items || [],
            author: c.author,
            avatarUrl: c.avatar_url,
            filePath: c.file_path,
            lineNumber: c.line_number,
            sentiment: c.sentiment,
            createdAt: c.created_at,
            isRead: c.is_read,
            githubCommentId: c.github_comment_id,
          });
        });

        setIsConnected(true);
        setIsLoading(false);
      } catch (err: any) {
        console.error('[useRSDRealtime] Error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchComments();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchComments, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (commentId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/rsd/comments/${commentId}/read`, {
        method: 'POST',
      });
      if (res.ok) {
        markRead(commentId);
      }
    } catch (err) {
      console.error('[useRSDRealtime] Mark read error:', err);
    }
  };

  return { isLoading, error, isConnected, markAsRead };
}
