import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  UserPlus,
  Film,
  Tv,
  Shield,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContent, M3UItem } from "@/contexts/ContentContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type UploadType = "movie" | "series";

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel = ({ onClose }: AdminPanelProps) => {
  const { isAdmin, user } = useAuth();

  const {
    previewContent,
    setPreviewContent,
    publishContent,
    hasUnpublished,
    publishedContent,
  } = useContent();

  const { toast } = useToast();
  const workerRef = useRef<Worker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadType, setUploadType] = useState<UploadType>("movie");
  const [status, setStatus] = useState<string | null>(null);

  // Estado para gerenciar acesso de usuários
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [allowedUsers, setAllowedUsers] = useState<Array<{ email: string; password: string }>>([]);

  // 🔐 Verificação de segurança - só permite acesso se for admin
  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar esta área",
        variant: "destructive",
      });
      onClose();
    }
  }, [isAdmin, onClose, toast]);

  // Carregar usuários permitidos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("allowed_users");
    if (saved) {
      try {
        setAllowedUsers(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar usuários:", e);
      }
    }
  }, []);

  useEffect(() => {
    workerRef.current = new Worker("/m3u-parser.worker.js");

    workerRef.current.onmessage = (e) => {
      const { status, item, message } = e.data;

      if (status === "progress") setStatus(message);

      if (status === "item") {
        setPreviewContent((current: M3UItem[]) => {
          if (current.some((i) => i.id === item.id)) return current;
          return [...current, item];
        });
      }

      if (status === "done") {
        setStatus(null);
        toast({ title: "Upload concluído" });
      }

      if (status === "error") {
        setStatus(null);
        toast({
          title: "Erro",
          description: message,
          variant: "destructive",
        });
      }
    };

    return () => workerRef.current?.terminate();
  }, [setPreviewContent, toast]);

  // Função para liberar acesso a um usuário
  const handleAddUser = () => {
    if (!userEmail || !userPassword) {
      toast({
        title: "Erro",
        description: "Email e senha são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const newUsers = [...allowedUsers, { email: userEmail, password: userPassword }];
    setAllowedUsers(newUsers);
    localStorage.setItem("allowed_users", JSON.stringify(newUsers));

    toast({
      title: "Sucesso",
      description: `Acesso liberado para ${userEmail}`,
    });

    setUserEmail("");
    setUserPassword("");
  };

  // Upload com publicação imediata
  const handleUploadAndPublish = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workerRef.current) return;

    setStatus("Processando e publicando...");
    
    workerRef.current.postMessage({ file, type: uploadType });

    if (fileInputRef.current) fileInputRef.current.value = "";

    setTimeout(() => {
      publishContent();
      toast({
        title: "Publicado!",
        description: `Conteúdo de ${uploadType === "movie" ? "filmes" : "séries"} foi publicado para todos os usuários`,
      });
    }, 2000);
  };

  // Estatísticas
  const totalPreview = previewContent.length;
  const totalPublished = publishedContent.length;
  const totalUnpublished = previewContent.filter(
    (item) => !publishedContent.some((pub) => pub.id === item.id)
  ).length;

  // Se não for admin, não renderiza nada
  if (!isAdmin) {
    return null;
  }

  return (
    <AnimatePresence>
      {/* Overlay/Background escuro */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4"
      >
        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-4xl my-8"
        >
          {/* Header do Modal */}
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border rounded-t-2xl p-6 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Painel Administrativo</h2>
                <p className="text-sm text-muted-foreground">Logado como: {user?.email}</p>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Conteúdo do Modal */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-secondary/30 rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">{totalPublished}</div>
                <div className="text-sm text-muted-foreground">Conteúdos Publicados</div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-yellow-500 mb-2">{totalUnpublished}</div>
                <div className="text-sm text-muted-foreground">Aguardando Publicação</div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-green-500 mb-2">{totalPreview}</div>
                <div className="text-sm text-muted-foreground">Total Carregado</div>
              </div>
            </div>

            {/* Seção para liberar acesso de usuários */}
            <div className="bg-secondary/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Liberar Acesso para Usuário
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Adicione email e senha para permitir que um usuário acesse a plataforma.
                Os dados podem ser sincronizados com Firebase Authentication.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                  type="email"
                  placeholder="Email do usuário"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="password"
                  placeholder="Senha"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button onClick={handleAddUser} className="gap-2 whitespace-nowrap">
                  <UserPlus className="w-4 h-4" />
                  Adicionar
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                {allowedUsers.length} usuário(s) com acesso liberado
              </div>
            </div>

            {/* Seleção de categoria (Filmes/Séries) */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Selecione a Categoria de Upload</h3>
              <div className="flex gap-2 mb-4">
                <Button
                  variant={uploadType === "movie" ? "default" : "secondary"}
                  onClick={() => setUploadType("movie")}
                  className="gap-2"
                >
                  <Film className="w-4 h-4" />
                  Filmes
                </Button>
                <Button
                  variant={uploadType === "series" ? "default" : "secondary"}
                  onClick={() => setUploadType("series")}
                  className="gap-2"
                >
                  <Tv className="w-4 h-4" />
                  Séries
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {uploadType === "movie" 
                  ? "O upload será adicionado na aba 'Filmes' do header" 
                  : "O upload será adicionado na aba 'Séries' do header"}
              </p>
            </div>

            {/* Upload + Publicar */}
            <div>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,.m3u,.m3u8"
                  onChange={handleUploadAndPublish}
                  className="hidden"
                />

                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="gap-2 whitespace-nowrap"
                  disabled={!!status}
                >
                  <Upload className="w-4 h-4" />
                  {status ?? "Upload e Publicar"}
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  {status ? status : "Arquivo será carregado e publicado automaticamente"}
                </span>
              </div>
            </div>

            {/* Publicar conteúdo pendente */}
            {hasUnpublished && (
              <div className="pt-4 border-t border-border">
                <Button onClick={publishContent} className="gap-2 w-full sm:w-auto" variant="outline">
                  <Send className="w-4 h-4" />
                  Publicar Conteúdo Pendente ({totalUnpublished})
                </Button>
              </div>
            )}
          </div>

          {/* Footer do Modal */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border rounded-b-2xl p-4 flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Fechar Painel
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminPanel;