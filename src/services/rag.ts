/**
 * RAG API Service
 * Production-level document Q&A with citations and web search
 */

import { apiClient, ApiResponse } from "./api";

export interface DocumentIngestRequest {
  text: string;
  doc_id: string;
  metadata?: Record<string, any>;
}

export interface DocumentIngestResponse {
  doc_id: string;
  chunk_count: number;
  status: string;
  message: string;
}

export interface QueryRequest {
  question: string;
  use_web_search?: boolean;
  top_k?: number;
  generate_answer?: boolean;
}

export interface Citation {
  chunk_id: string;
  content: string;
  doc_id: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface WebResult {
  title: string;
  url: string;
  snippet: string;
  score: number;
}

export interface QueryResponse {
  question: string;
  context: string;
  citations: Citation[];
  web_results: WebResult[];
  answer?: string;
  num_chunks: number;
  num_web_results: number;
}

export interface RAGStats {
  total_chunks: number;
  total_documents: number;
  embedding_model: string;
  chunk_size: number;
  chunk_overlap: number;
  top_k: number;
  web_search_enabled: boolean;
}

export interface RAGDocument {
  doc_id: string;
  chunk_count: number;
  metadata?: Record<string, any>;
}

export const ragApi = {
  /**
   * Ingest a document into the RAG system
   */
  ingestDocument: async (
    request: DocumentIngestRequest
  ): Promise<ApiResponse<DocumentIngestResponse>> => {
    return apiClient.post("/rag/ingest", request);
  },

  /**
   * Ingest a file (TXT, MD) into the RAG system
   */
  ingestFile: async (file: File): Promise<ApiResponse<DocumentIngestResponse>> => {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient.upload("/rag/ingest-file", formData);
  },

  /**
   * Query the RAG system with a question
   */
  query: async (request: QueryRequest): Promise<ApiResponse<QueryResponse>> => {
    return apiClient.post("/rag/query", request);
  },

  /**
   * Delete a document from the RAG system
   */
  deleteDocument: async (docId: string): Promise<ApiResponse<{ status: string; message: string }>> => {
    return apiClient.delete("/rag/document", { data: { doc_id: docId } });
  },

  /**
   * Get RAG system statistics
   */
  getStats: async (): Promise<ApiResponse<RAGStats>> => {
    return apiClient.get("/rag/stats");
  },

  /**
   * List all documents in the RAG system
   */
  listDocuments: async (): Promise<ApiResponse<RAGDocument[]>> => {
    return apiClient.get("/rag/documents");
  },
};
