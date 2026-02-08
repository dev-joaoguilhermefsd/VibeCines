// Firebase Backend para persistência em nuvem
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import { app } from "@/firebase.config";

const db = getFirestore(app);

// Coleções
const COLLECTIONS = {
  PUBLISHED_CONTENT: "published_content",
  ENRICHED_SERIES: "enriched_series",
  METADATA: "metadata"
};

export class FirebaseBackend {
  // Salvar conteúdo publicado
  static async savePublishedContent(content: any[]) {
    try {
      const docRef = doc(db, COLLECTIONS.PUBLISHED_CONTENT, "main");
      await setDoc(docRef, {
        content,
        updatedAt: new Date().toISOString()
      });
      console.log("✅ Conteúdo salvo no Firebase");
      return true;
    } catch (error) {
      console.error("❌ Erro ao salvar conteúdo:", error);
      return false;
    }
  }

  // Carregar conteúdo publicado
  static async loadPublishedContent(): Promise<any[]> {
    try {
      const docRef = doc(db, COLLECTIONS.PUBLISHED_CONTENT, "main");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log("✅ Conteúdo carregado do Firebase");
        return docSnap.data().content || [];
      }
      
      console.log("ℹ️ Nenhum conteúdo encontrado no Firebase");
      return [];
    } catch (error) {
      console.error("❌ Erro ao carregar conteúdo:", error);
      return [];
    }
  }

  // Salvar dados enriquecidos de séries
  static async saveEnrichedSeriesData(data: Record<string, any>) {
    try {
      const docRef = doc(db, COLLECTIONS.ENRICHED_SERIES, "main");
      await setDoc(docRef, {
        data,
        updatedAt: new Date().toISOString()
      });
      console.log("✅ Dados de séries salvos no Firebase");
      return true;
    } catch (error) {
      console.error("❌ Erro ao salvar dados de séries:", error);
      return false;
    }
  }

  // Carregar dados enriquecidos de séries
  static async loadEnrichedSeriesData(): Promise<Record<string, any>> {
    try {
      const docRef = doc(db, COLLECTIONS.ENRICHED_SERIES, "main");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log("✅ Dados de séries carregados do Firebase");
        return docSnap.data().data || {};
      }
      
      return {};
    } catch (error) {
      console.error("❌ Erro ao carregar dados de séries:", error);
      return {};
    }
  }

  // Salvar metadata
  static async saveMetadata(metadata: any) {
    try {
      const docRef = doc(db, COLLECTIONS.METADATA, "main");
      await setDoc(docRef, {
        ...metadata,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error("❌ Erro ao salvar metadata:", error);
      return false;
    }
  }

  // Carregar metadata
  static async loadMetadata(): Promise<any> {
    try {
      const docRef = doc(db, COLLECTIONS.METADATA, "main");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      return {
        lastUpdated: new Date().toISOString(),
        totalMovies: 0,
        totalSeries: 0,
        totalEpisodes: 0
      };
    } catch (error) {
      console.error("❌ Erro ao carregar metadata:", error);
      return {
        lastUpdated: new Date().toISOString(),
        totalMovies: 0,
        totalSeries: 0,
        totalEpisodes: 0
      };
    }
  }
}