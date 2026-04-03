"use client"

import type React from "react"
import type { RefObject } from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  AlertCircle
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import DocumentsSidebar from "./documents-sidebar"
import DocumentViewer from "./document-viewer"
import ChatSidebar from "./chat-sidebar"
import GraphViewer from "./graph-viewer"

export interface Document {
  document_id: string
  filename: string
  status: string
  progress?: number
  created_at: string
  size?: string
  model?: string
  error?: string
  chunks?: number
  entities?: number
  relationships?: number
}

interface DocumentsTabProps {
  fileInputRef?: React.RefObject<HTMLInputElement>
}

export default function DocumentsTab({ fileInputRef }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [graphViewerOpen, setGraphViewerOpen] = useState(false)
  const [selectedDocForGraph, setSelectedDocForGraph] = useState<Document | null>(null)

  // Toggle states for panels
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)

  useEffect(() => {
    loadDocuments()
  }, [])

  // Polling for processing documents - use status endpoint
  const processingDocs = documents.filter(d => d.status === "Processing")

  useEffect(() => {
    if (processingDocs.length === 0) return

    const checkStatuses = async () => {
      try {
        const statusPromises = processingDocs.map(doc =>
          apiClient.getDocumentStatus(doc.document_id).catch(() => null)
        )
        const statuses = await Promise.all(statusPromises)

        // Verificar se algum documento terminou de processar
        const anyCompleted = statuses.some((s: any) =>
          s && (s.status === "Completed" || s.status === "Failed")
        )

        // Se algum completou, recarrega a lista completa para pegar todas as infos
        if (anyCompleted) {
          loadDocuments()
        } else {
          // Apenas atualizar o progresso
          setDocuments(prevDocs => prevDocs.map(doc => {
            const newStatus = statuses.find((s: any) => s?.document_id === doc.document_id)
            if (newStatus) {
              return { ...doc, status: newStatus.status, progress: newStatus.progress, error: newStatus.error }
            }
            return doc
          }))
        }
      } catch (err) {
        console.error("Erro ao verificar status:", err)
      }
    }

    const interval = setInterval(checkStatuses, 3000)
    return () => clearInterval(interval)
  }, [processingDocs.length])

  const loadDocuments = async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await apiClient.listDocuments()

      let docs: Document[] = []
      if (Array.isArray(response)) {
        docs = response
      } else if (response && typeof response === 'object' && Array.isArray((response as any).documents)) {
        docs = (response as any).documents
      } else {
        console.error("Formato de resposta inesperado:", response)
        docs = []
      }

      setDocuments(docs)

      // Update selected document if it exists
      if (selectedDocument) {
        const updated = docs.find((d: Document) => d.document_id === selectedDocument.document_id)
        if (updated) {
          setSelectedDocument(updated)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar documentos"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/msword",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/csv"
    ]

    if (!validTypes.includes(file.type) && !file.name.endsWith(".csv")) {
      setError("Tipo de arquivo não suportado. Por favor envie PDF, DOCX, TXT, XLSX, PPTX ou CSV.")
      return
    }

    const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4 MB safety limit for Vercel Serverless
    if (file.size > MAX_FILE_SIZE) {
      setError(`O arquivo é muito pesado (${(file.size / 1024 / 1024).toFixed(1)} MB). O limite atual é de 4 MB.`)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Only upload, don't process
      await apiClient.uploadDocument(file)
      // Reload documents to show the new one
      await loadDocuments()
    } catch (err) {
      let message = err instanceof Error ? err.message : "Erro ao fazer upload do documento"

      // Catch network errors specifically triggered by Vercel 413 blocked requests (CORS missing)
      if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
        message = "O servidor recusou a conexão. Isso costuma ocorrer se o arquivo exceder os limites ocultos de rede (como o limite de 4.5MB da Vercel)."
      }

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await apiClient.deleteDocument(documentId)
      setDocuments(documents.filter((d) => d.document_id !== documentId))
      if (selectedDocument?.document_id === documentId) {
        setSelectedDocument(null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao deletar documento"
      setError(message)
      throw err // Re-throw so the UI can stop loading
    }
  }

  const handleProcessDocument = async (documentId: string, model: string = "low") => {
    try {
      await apiClient.processDocument(documentId, model, "generic")
      setTimeout(() => loadDocuments(), 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao processar documento"
      setError(message)
    }
  }

  const handleSelectDocument = (doc: Document) => {
    setSelectedDocument(doc)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="m-2 mb-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Toggle Controls Header - Always Visible */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.08] bg-[#071312]/50 backdrop-blur-sm flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLeftPanel(!showLeftPanel)}
          className="h-8 px-3 gap-2 text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all"
          title={showLeftPanel ? "Ocultar documentos" : "Mostrar documentos"}
        >
          {showLeftPanel ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
          <span className="text-xs font-medium hidden md:inline">Docs</span>
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRightPanel(!showRightPanel)}
          className="h-8 px-3 gap-2 text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all"
          title={showRightPanel ? "Ocultar chat" : "Mostrar chat"}
        >
          <span className="text-xs font-medium hidden md:inline">Chat</span>
          {showRightPanel ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRightOpen className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Documents Sidebar */}
          {showLeftPanel && (
            <>
              <ResizablePanel
                defaultSize={22}
                minSize={18}
                maxSize={35}
              >
                <DocumentsSidebar
                  documents={documents}
                  selectedDocument={selectedDocument}
                  onSelectDocument={handleSelectDocument}
                  onRefresh={loadDocuments}
                  onUpload={handleFileUpload}
                  isLoading={isLoading}
                  fileInputRef={fileInputRef}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Center Panel - Document Viewer */}
          <ResizablePanel
            defaultSize={showLeftPanel && showRightPanel ? 53 : showLeftPanel || showRightPanel ? 75 : 100}
            minSize={30}
          >
            <DocumentViewer
              document={selectedDocument}
              onProcess={handleProcessDocument}
              onDelete={handleDeleteDocument}
              onRefresh={loadDocuments}
              onViewGraph={(doc) => {
                setSelectedDocForGraph(doc)
                setGraphViewerOpen(true)
              }}
            />
          </ResizablePanel>

          {/* Right Panel - Chat Sidebar */}
          {showRightPanel && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel
                defaultSize={25}
                minSize={20}
                maxSize={40}
              >
                <ChatSidebar selectedDocument={selectedDocument} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Graph Viewer Dialog */}
      {selectedDocForGraph && (
        <GraphViewer
          documentId={selectedDocForGraph.document_id}
          filename={selectedDocForGraph.filename}
          isOpen={graphViewerOpen}
          onClose={() => {
            setGraphViewerOpen(false)
            setSelectedDocForGraph(null)
          }}
        />
      )}
    </div>
  )
}
