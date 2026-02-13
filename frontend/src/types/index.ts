export interface Session {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  session_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning_content?: string;
  created_at: string;
}

export type StreamChunkType = 'reasoning' | 'content' | 'done' | 'session_title';

export interface StreamChunk {
  type: StreamChunkType;
  data: string;
}
