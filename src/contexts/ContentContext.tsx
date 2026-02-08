// --- INÍCIO: src/contexts/ContentContext.tsx ---
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { groupEpisodesBySeries, type GroupedSeries } from "@/utils/seriesParser";
import { UploadHistoryManager, dateUtils } from "@/hooks/usePersistence";
import { FirebaseBackend } from "@/services/firebase-backend";

export interface M3UItem {
  id: string;
  title: string;
  image?: string;
  category: string;
  url: string;
  source?: string; // 'movie' ou 'series'
}

// Nova interface para série enriquecida com dados do TMDb
export interface EnrichedSeries extends GroupedSeries {
  tmdbId?: number;
  poster?: string;
  backdrop?: string;
  overview?: string;
  firstAirDate?: string;
  rating?: number;
}

// Metadata sobre o conteúdo
export interface ContentMetadata {
  lastUpdated: string;
  totalMovies: number;
  totalSeries: number;
  totalEpisodes: number;
}

interface ContentContextType {
  // Conteúdo bruto
  previewContent: M3UItem[];
  publishedContent: M3UItem[];
  
  // Filmes separados
  previewMovies: M3UItem[];
  publishedMovies: M3UItem[];
  
  // Séries organizadas
  previewSeries: EnrichedSeries[];
  publishedSeries: EnrichedSeries[];
  
  // Metadata
  metadata: ContentMetadata;
  
  // Funções
  setPreviewContent: React.Dispatch<React.SetStateAction<M3UItem[]>>;
  publishContent: () => void;
  hasUnpublished: boolean;
  
  // Enriquecer séries com dados do TMDb
  enrichSeries: (series: GroupedSeries, tmdbData: any) => void;
  
  // Limpar dados
  clearAllData: () => void;
  clearPreview: () => void;
  
  // Histórico
  getUploadHistory: () => Promise<any[]>;
  
  // Auto-save status
  isAutoSaving: boolean;
  lastSaved: string | null;
  
  // Loading state
  isLoading: boolean;
}

const ContentContext = createContext<ContentContextType | null>(null);

export const ContentProvider = ({ children }: { children: ReactNode }) => {
  // Estados principais
  const [previewContent, setPreviewContent] = useState<M3UItem[]>([]);
  const [publishedContent, setPublishedContent] = useState<M3UItem[]>([]);
  const [enrichedSeriesData, setEnrichedSeriesData] = useState<Record<string, any>>({});
  const [metadata, setMetadata] = useState<ContentMetadata>({
    lastUpdated: new Date().toISOString(),
    totalMovies: 0,
    totalSeries: 0,
    totalEpisodes: 0,
  });

  // Estado de controle
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref para controlar se já carregou dados iniciais
  const initialLoadDone = useRef(false);
  
  // Ref para evitar save desnecessário durante load
  const isLoadingData = useRef(true);

  // 🔥 CARREGAR DADOS DO FIREBASE NA INICIALIZAÇÃO - APENAS UMA VEZ
  useEffect(() => {
    if (initialLoadDone.current) return;
    
    const loadData = async () => {
      isLoadingData.current = true;
      setIsLoading(true);
      console.log("📥 Carregando dados do Firebase...");
      
      try {
        const [content, seriesData, meta] = await Promise.all([
          FirebaseBackend.loadPublishedContent(),
          FirebaseBackend.loadEnrichedSeriesData(),
          FirebaseBackend.loadMetadata()
        ]);

        if (content && content.length > 0) {
          console.log("✅ Dados encontrados no Firebase:", content.length, "itens");
          setPublishedContent(content);
        } else {
          console.log("ℹ️ Nenhum dado encontrado no Firebase");
        }
        
        if (seriesData && Object.keys(seriesData).length > 0) {
          setEnrichedSeriesData(seriesData);
        }
        
        if (meta) {
          setMetadata(meta);
        }
        
        initialLoadDone.current = true;
      } catch (error) {
        console.error("❌ Erro ao carregar dados:", error);
      } finally {
        setIsLoading(false);
        isLoadingData.current = false;
      }
    };

    loadData();
  }, []);

  // Separar filmes do preview
  const previewMovies = useMemo(
    () => previewContent.filter((item) => item.source === "movie"),
    [previewContent]
  );

  // Separar filmes publicados
  const publishedMovies = useMemo(
    () => publishedContent.filter((item) => item.source === "movie"),
    [publishedContent]
  );

  // Agrupar séries do preview
  const previewSeries = useMemo(() => {
    const seriesItems = previewContent.filter((item) => item.source === "series");
    const grouped = groupEpisodesBySeries(seriesItems);
    
    // Enriquecer com dados do TMDb salvos
    return grouped.map((series) => {
      const tmdbData = enrichedSeriesData[series.normalizedName];
      return {
        ...series,
        tmdbId: tmdbData?.tmdbId,
        poster: tmdbData?.poster,
        backdrop: tmdbData?.backdrop,
        overview: tmdbData?.overview,
        firstAirDate: tmdbData?.firstAirDate,
        rating: tmdbData?.rating,
      };
    });
  }, [previewContent, enrichedSeriesData]);

  // Agrupar séries publicadas
  const publishedSeries = useMemo(() => {
    const seriesItems = publishedContent.filter((item) => item.source === "series");
    const grouped = groupEpisodesBySeries(seriesItems);
    
    // Enriquecer com dados do TMDb salvos
    return grouped.map((series) => {
      const tmdbData = enrichedSeriesData[series.normalizedName];
      return {
        ...series,
        tmdbId: tmdbData?.tmdbId,
        poster: tmdbData?.poster,
        backdrop: tmdbData?.backdrop,
        overview: tmdbData?.overview,
        firstAirDate: tmdbData?.firstAirDate,
        rating: tmdbData?.rating,
      };
    });
  }, [publishedContent, enrichedSeriesData]);

  // 🔥 SALVAR NO FIREBASE QUANDO CONTEÚDO PUBLICADO MUDAR
  // Mas APENAS após o carregamento inicial estar completo
  useEffect(() => {
    // Não salvar durante carregamento inicial
    if (isLoadingData.current || !initialLoadDone.current) {
      console.log("⏭️ Ignorando save durante carregamento inicial");
      return;
    }
    
    // Não salvar se estiver vazio (pode ser estado inicial)
    if (publishedContent.length === 0) {
      console.log("⏭️ Conteúdo vazio, não salvando");
      return;
    }

    const saveData = async () => {
      console.log("💾 Salvando conteúdo publicado no Firebase...", publishedContent.length, "itens");
      setIsAutoSaving(true);
      
      try {
        await FirebaseBackend.savePublishedContent(publishedContent);
        setLastSaved(dateUtils.format(new Date()));
        console.log("✅ Conteúdo salvo com sucesso!");
      } catch (error) {
        console.error("❌ Erro ao salvar:", error);
      } finally {
        setTimeout(() => setIsAutoSaving(false), 500);
      }
    };
    
    saveData();
  }, [publishedContent]);

  // 🔥 SALVAR DADOS DE SÉRIES NO FIREBASE
  useEffect(() => {
    if (isLoadingData.current || !initialLoadDone.current) {
      return;
    }
    
    if (Object.keys(enrichedSeriesData).length === 0) {
      return;
    }

    const saveData = async () => {
      try {
        await FirebaseBackend.saveEnrichedSeriesData(enrichedSeriesData);
        console.log("✅ Dados de séries salvos!");
      } catch (error) {
        console.error("❌ Erro ao salvar dados de séries:", error);
      }
    };
    
    // Debounce de 1 segundo
    const timeout = setTimeout(saveData, 1000);
    return () => clearTimeout(timeout);
  }, [enrichedSeriesData]);

  // Atualizar metadata quando conteúdo mudar
  useEffect(() => {
    const totalEpisodesPublished = publishedSeries.reduce(
      (sum, series) => sum + series.totalEpisodes,
      0
    );

    const newMetadata = {
      lastUpdated: new Date().toISOString(),
      totalMovies: publishedMovies.length,
      totalSeries: publishedSeries.length,
      totalEpisodes: totalEpisodesPublished,
    };
    
    setMetadata(newMetadata);
    
    // Salvar metadata no Firebase
    if (!isLoadingData.current && initialLoadDone.current && publishedContent.length > 0) {
      FirebaseBackend.saveMetadata(newMetadata);
    }
  }, [publishedMovies, publishedSeries, publishedContent.length]);

  // Enriquecer série com dados do TMDb
  const enrichSeries = useCallback(
    (series: GroupedSeries, tmdbData: any) => {
      setIsAutoSaving(true);
      
      setEnrichedSeriesData((prev) => ({
        ...prev,
        [series.normalizedName]: tmdbData,
      }));

      setLastSaved(dateUtils.format(new Date()));
      setTimeout(() => setIsAutoSaving(false), 500);
    },
    []
  );

  // Publicar conteúdo
  const publishContent = useCallback(() => {
    console.log("📤 Publicando conteúdo...", previewContent.length, "itens");
    setIsAutoSaving(true);
    
    // Mescla preview com publicado, evitando duplicatas
    setPublishedContent((current) => {
      const currentIds = new Set(current.map(item => item.id));
      const newItems = previewContent.filter(item => !currentIds.has(item.id));
      const merged = [...current, ...newItems];
      
      console.log("📊 Total após merge:", merged.length, "itens");
      return merged;
    });

    // Adicionar ao histórico (localStorage)
    UploadHistoryManager.addUpload({
      uploadedAt: new Date().toISOString(),
      totalItems: previewContent.length,
      type: previewContent.some((i) => i.source === "series") ? "series" : "movie",
      fileName: "M3U Upload",
    });

    setLastSaved(dateUtils.format(new Date()));
    setTimeout(() => setIsAutoSaving(false), 500);
  }, [previewContent]);

  // Limpar apenas preview
  const clearPreview = useCallback(() => {
    setPreviewContent([]);
  }, []);

  // Limpar todos os dados
  const clearAllData = useCallback(async () => {
    console.log("🗑️ Limpando todos os dados...");
    
    setPreviewContent([]);
    setPublishedContent([]);
    setEnrichedSeriesData({});
    setMetadata({
      lastUpdated: new Date().toISOString(),
      totalMovies: 0,
      totalSeries: 0,
      totalEpisodes: 0,
    });
    
    // Limpar Firebase
    try {
      await FirebaseBackend.savePublishedContent([]);
      await FirebaseBackend.saveEnrichedSeriesData({});
      await FirebaseBackend.saveMetadata({
        lastUpdated: new Date().toISOString(),
        totalMovies: 0,
        totalSeries: 0,
        totalEpisodes: 0,
      });
      console.log("✅ Dados limpos no Firebase");
    } catch (error) {
      console.error("❌ Erro ao limpar Firebase:", error);
    }
  }, []);

  // Obter histórico de uploads
  const getUploadHistory = useCallback(async () => {
    return UploadHistoryManager.getHistory();
  }, []);

  // Verificar se há conteúdo não publicado
  const hasUnpublished = useMemo(() => {
    const publishedIds = new Set(publishedContent.map(i => i.id));
    return previewContent.some(item => !publishedIds.has(item.id));
  }, [previewContent, publishedContent]);

  return (
    <ContentContext.Provider
      value={{
        previewContent,
        publishedContent,
        previewMovies,
        publishedMovies,
        previewSeries,
        publishedSeries,
        metadata,
        setPreviewContent,
        publishContent,
        hasUnpublished,
        enrichSeries,
        clearAllData,
        clearPreview,
        getUploadHistory,
        isAutoSaving,
        lastSaved,
        isLoading,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error("useContent must be used within ContentProvider");
  }
  return context;
};
// --- FIM: src/contexts/ContentContext.tsx ---