import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, CloudOff, Database, Trash2, History } from "lucide-react";
import { useContent } from "@/contexts/ContentContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { dateUtils } from "@/hooks/usePersistence";

const PersistenceStatus = () => {
  const {
    metadata,
    isAutoSaving,
    lastSaved,
    clearAllData,
    getUploadHistory,
  } = useContent();

  const [uploadHistory, setUploadHistory] = useState<any[]>([]);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (isAutoSaving) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isAutoSaving]);

  const loadHistory = async () => {
    const history = await getUploadHistory();
    setUploadHistory(history);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return dateUtils.format(date, "dd/MM/yyyy HH:mm");
  };

  const handleClearData = () => {
    if (
      window.confirm(
        "Tem certeza que deseja limpar TODOS os dados? Esta aÃ§Ã£o nÃ£o pode ser desfeita."
      )
    ) {
      clearAllData();
      alert("Todos os dados foram removidos!");
    }
  };

  return (
    <>
      {/* Toast de Auto-Save */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg"
          >
            <Cloud className="h-4 w-4" />
            Salvando automaticamente...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Badge */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
        {/* Info Card */}
        <div className="rounded-lg bg-secondary/90 p-3 text-xs backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <Database className="h-4 w-4 text-primary" />
            Armazenamento Local
          </div>

          <div className="space-y-1 text-muted-foreground">
            <div className="flex justify-between gap-4">
              <span>Filmes:</span>
              <span className="font-mono">{metadata.totalMovies}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>SÃ©ries:</span>
              <span className="font-mono">{metadata.totalSeries}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>EpisÃ³dios:</span>
              <span className="font-mono">{metadata.totalEpisodes}</span>
            </div>
          </div>

          {lastSaved && (
            <div className="mt-2 border-t border-border pt-2 text-[10px] text-muted-foreground">
              Ãšltimo save: {lastSaved}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* HistÃ³rico */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={loadHistory}
              >
                <History className="h-4 w-4" />
                HistÃ³rico
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>HistÃ³rico de Uploads</DialogTitle>
                <DialogDescription>
                  Ãšltimas atividades de upload de conteÃºdo
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-96 space-y-2 overflow-y-auto">
                {uploadHistory.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum upload registrado ainda
                  </p>
                ) : (
                  uploadHistory.map((upload, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium capitalize">
                          {upload.type === "movie" ? "Filmes" : "SÃ©ries"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {upload.totalItems} itens
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(upload.uploadedAt)}
                      </p>
                      {upload.fileName && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {upload.fileName}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Limpar Dados */}
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={handleClearData}
          >
            <Trash2 className="h-4 w-4" />
            Limpar
          </Button>
        </div>
      </div>
    </>
  );
};

export default PersistenceStatus;