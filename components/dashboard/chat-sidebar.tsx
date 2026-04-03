"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, AlertCircle, MessageSquare, Trash2, FileText } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface Document {
  document_id: string
  filename: string
  status: string
  created_at?: string
  model?: string
  size?: string
  chunks?: number
  entities?: number
  relationships?: number
  processing_started_at?: string
  processing_completed_at?: string
  file_hash?: string
  file_size?: number
  summary?: string
}

// Mapeamento de modelos simplificados para nomes completos
const MODEL_NAME_MAP: Record<string, string> = {
  'low': 'ChatGPT 4.1 mini',
  'high': 'ChatGPT 4.1',
  'gpt-4o-mini': 'ChatGPT 4.1 mini',
  'gpt-4o': 'ChatGPT 4.1',
  'gpt-4-turbo': 'ChatGPT 4 Turbo',
  'gpt-3.5-turbo': 'ChatGPT 3.5 Turbo',
  'claude-3-haiku': 'Claude 3 Haiku',
  'claude-3-sonnet': 'Claude 3 Sonnet',
  'claude-3-opus': 'Claude 3 Opus',
}

interface ChatSidebarProps {
  selectedDocument: Document | null
}

export default function ChatSidebar({ selectedDocument }: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "info">("chat")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Olá! Selecione um documento processado e faça perguntas.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Estado para informações do documento
  const [docInfo, setDocInfo] = useState<Document | null>(null)
  const [isLoadingInfo, setIsLoadingInfo] = useState(false)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (selectedDocument) {
      const statusMsg = selectedDocument.status === "Completed"
        ? "Como posso ajudar?"
        : "Processe o documento primeiro para fazer perguntas."

      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `📄 "${selectedDocument.filename.substring(0, 30)}${selectedDocument.filename.length > 30 ? '...' : ''}" selecionado.\n\n${statusMsg}`,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
      setError("")
      
      // Carregar informações completas do documento
      loadDocumentInfo(selectedDocument.document_id)
    }
  }, [selectedDocument?.document_id])
  
  const loadDocumentInfo = async (documentId: string) => {
    setIsLoadingInfo(true)
    try {
      const response = await apiClient.listDocuments()
      let docs: Document[] = []
      
      if (Array.isArray(response)) {
        docs = response
      } else if (response && typeof response === 'object' && Array.isArray((response as any).documents)) {
        docs = (response as any).documents
      }
      
      const doc = docs.find(d => d.document_id === documentId)
      if (doc) {
        setDocInfo(doc)
      }
    } catch (err) {
      console.error("Erro ao carregar info do documento:", err)
    } finally {
      setIsLoadingInfo(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: "assistant",
      content: selectedDocument
        ? `Chat limpo. Faça uma nova pergunta sobre "${selectedDocument.filename}".`
        : "Chat limpo. Selecione um documento.",
      timestamp: new Date(),
    }])
    setError("")
  }

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedDocument) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError("")

    try {
      // Chat usando o modelo do documento
      const response = await apiClient.chat(input, selectedDocument.document_id)

      // Usar response da API de chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response || "Não encontrei informações relevantes. Tente reformular.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao processar"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const canChat = selectedDocument?.status === "Completed"

  return (
    <div className="h-full flex flex-col bg-[#0B0F19] border-r border-white/[0.05] overflow-hidden">
      {/* Header - Tabs Minimalistas */}
      <div className="border-b border-white/[0.05] flex-shrink-0">
        <div className="flex">
          <Button
            variant={activeTab === "chat" ? "default" : "ghost"}
            onClick={() => setActiveTab("chat")}
            className={cn(
              "rounded-none border-b-2 transition-all duration-200 flex-1 text-xs h-10 font-medium relative overflow-hidden group",
              activeTab === "chat"
                ? "border-blue-500 bg-white/[0.03] text-white"
                : "border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]"
            )}
          >
            {activeTab === "chat" && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 -z-10" />
            )}
            <MessageSquare className="w-4 h-4 mr-2" />
            Sincron.IA
            {activeTab === "chat" && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            )}
          </Button>
          <Button
            variant={activeTab === "info" ? "default" : "ghost"}
            onClick={() => setActiveTab("info")}
            className={cn(
              "rounded-none border-b-2 transition-all duration-200 flex-1 text-xs h-10 font-medium relative overflow-hidden group",
              activeTab === "info"
                ? "border-blue-500 bg-white/[0.03] text-white"
                : "border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]"
            )}
          >
            {activeTab === "info" && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 -z-10" />
            )}
            <FileText className="w-4 h-4 mr-2" />
            Informações
            {activeTab === "info" && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="m-2 p-2">
          <AlertCircle className="h-3 w-3" />
          <AlertDescription className="text-xs ml-1">{error}</AlertDescription>
        </Alert>
      )}

      {/* Conteúdo das Abas */}
      {activeTab === "chat" ? (
        <ChatContent
          messages={messages}
          setMessages={setMessages}
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          selectedDocument={selectedDocument}
          canChat={canChat}
          handleSendMessage={handleSendMessage}
          messagesEndRef={messagesEndRef}
        />
      ) : (
        <InfoContent
          document={docInfo}
          isLoading={isLoadingInfo}
        />
      )}
    </div>
  )
}

// Componente de Chat
function ChatContent({
  messages,
  setMessages,
  input,
  setInput,
  isLoading,
  setIsLoading,
  selectedDocument,
  canChat,
  handleSendMessage,
  messagesEndRef,
}: {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  setIsLoading: (value: boolean) => void
  selectedDocument: Document | null
  canChat: boolean
  handleSendMessage: () => Promise<void>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}) {
  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: "assistant",
      content: selectedDocument
        ? `Chat limpo. Faça uma nova pergunta sobre "${selectedDocument.filename}".`
        : "Chat limpo. Selecione um documento.",
      timestamp: new Date(),
    }])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-[#1A1F2E] text-slate-100 border border-white/[0.05]"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                <span className="text-[10px] opacity-60 mt-2 block">
                  {message.timestamp.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#1A1F2E] px-4 py-3 rounded-2xl border border-white/[0.05]">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-white/[0.05] bg-[#0B0F19] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder={canChat ? "Digite sua pergunta..." : "Processe o documento primeiro"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || !canChat}
              className="w-full h-11 bg-[#1A1F2E] border-white/[0.08] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 rounded-xl pl-4 pr-4 text-sm text-white placeholder:text-slate-500 transition-all"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim() || !canChat}
            size="icon"
            className={cn(
              "h-11 w-11 rounded-xl transition-all",
              isLoading || !input.trim() || !canChat
                ? "bg-[#1A1F2E] text-slate-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Componente de Informações
function InfoContent({
  document,
  isLoading,
}: {
  document: Document | null
  isLoading: boolean
}) {
  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md space-y-4">
          <FileText className="w-16 h-16 mx-auto text-slate-600" />
          <h3 className="text-base font-medium text-slate-300">Nenhum documento selecionado</h3>
          <p className="text-sm text-slate-500">
            Selecione um documento na barra lateral para visualizar suas informações
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-3">
        {/* Header do Documento */}
        <div className="bg-[#1A1F2E] border border-white/[0.05] rounded-xl p-3">
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${
                document.status === "Completed" ? "bg-green-500/10 text-green-400" :
                document.status === "Processing" ? "bg-blue-500/10 text-blue-400" :
                document.status === "Failed" ? "bg-red-500/10 text-red-400" :
                "bg-yellow-500/10 text-yellow-400"
              }`}>
                {document.status === "Completed" ? "Concluído" :
                 document.status === "Processing" ? "Processando" :
                 document.status === "Failed" ? "Erro" : "Pendente"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-medium text-white line-clamp-2 leading-snug">
                {document.filename}
              </h3>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="bg-[#1A1F2E] border border-white/[0.05] rounded-xl p-3">
          <h4 className="text-[10px] font-medium text-slate-400 mb-2">Estatísticas</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/[0.02] rounded-lg p-2">
              <p className="text-[9px] text-slate-500 mb-0.5">Chunks</p>
              <p className="text-xs font-semibold text-blue-400">{document.chunks ?? "—"}</p>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-2">
              <p className="text-[9px] text-slate-500 mb-0.5">Entidades</p>
              <p className="text-xs font-semibold text-green-400">{document.entities ?? "—"}</p>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-2">
              <p className="text-[9px] text-slate-500 mb-0.5">Relacionamentos</p>
              <p className="text-xs font-semibold text-purple-400">{document.relationships ?? "—"}</p>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-2">
              <p className="text-[9px] text-slate-500 mb-0.5">Tamanho</p>
              <p className="text-[10px] font-semibold text-slate-300">
                {document.file_size ? `${(document.file_size / 1024 / 1024).toFixed(2)} MB` : (document.size ?? "—")}
              </p>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-[#1A1F2E] border border-white/[0.05] rounded-xl p-3">
          <h4 className="text-[10px] font-medium text-slate-400 mb-2">Informações Adicionais</h4>
          <div className="space-y-1.5">
            <div className="flex justify-between py-1.5 border-t border-white/[0.05] first:border-0">
              <span className="text-[10px] text-slate-500">Modelo LLM</span>
              <span className="text-[10px] text-slate-300 font-medium">
                {(() => {
                  const rawModel = document.model?.toLowerCase() || 'desconhecido';
                  return MODEL_NAME_MAP[rawModel] || document.model || 'ChatGPT 4.1 mini';
                })()}
              </span>
            </div>
            
            {document.processing_started_at && (
              <div className="flex justify-between py-1.5 border-t border-white/[0.05]">
                <span className="text-[10px] text-slate-500">Início do Processamento</span>
                <span className="text-[10px] text-slate-300 font-medium">
                  {new Date(document.processing_started_at).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
            
            {document.processing_completed_at && (
              <div className="flex justify-between py-1.5 border-t border-white/[0.05]">
                <span className="text-[10px] text-slate-500">Fim do Processamento</span>
                <span className="text-[10px] text-slate-300 font-medium">
                  {new Date(document.processing_completed_at).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
            
            {document.file_hash && document.file_hash !== 'legacy-no-hash' && (
              <div className="flex justify-between py-1.5 border-t border-white/[0.05]">
                <span className="text-[10px] text-slate-500">Hash do Documento</span>
                <span className="text-[10px] text-slate-300 font-mono">
                  {document.file_hash.substring(0, 8)}...{document.file_hash.substring(document.file_hash.length - 8)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between py-1.5 border-t border-white/[0.05] first:border-0">
              <span className="text-[10px] text-slate-500">Data de Upload</span>
              <span className="text-[10px] text-slate-300">
                {document.created_at 
                  ? new Date(document.created_at).toLocaleDateString("pt-BR")
                  : "—"
                }
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-t border-white/[0.05] first:border-0">
              <span className="text-[10px] text-slate-500">ID do Documento</span>
              <span className="text-[9px] text-slate-400 font-mono bg-white/[0.05] px-1.5 py-0.5 rounded">
                {document.document_id}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
