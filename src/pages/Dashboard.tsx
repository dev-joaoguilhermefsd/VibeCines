// --- INÍCIO: src/pages/Dashboard.tsx ---
import { useState, useMemo } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import FeaturedHero from "@/components/FeaturedHero";
import ContentRow from "@/components/ContentRow";
import SeriesRow from "@/components/SeriesRow";
import Footer from "@/components/Footer";
import VideoPlayer from "@/components/VideoPlayer";
import AdminPanel from "@/components/AdminPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useContent } from "@/contexts/ContentContext";

const ROW_LIMIT = 12;

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const {
    publishedMovies,
    publishedSeries,
  } = useContent();

  const [playerMovie, setPlayerMovie] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const [showAdmin, setShowAdmin] = useState(false);

  // 🔐 USUÁRIOS COMUNS SEMPRE VEEM APENAS CONTEÚDO PUBLICADO
  const movies = publishedMovies;
  const series = publishedSeries;

  // Normalizar filmes (garantir que image existe)
  const normalizedMovies = useMemo(
    () =>
      movies.map((item) => ({
        ...item,
        image: item.image || "/placeholder.jpg",
      })),
    [movies]
  );

  // Filme destaque para o hero
  const featuredMovie = useMemo(() => {
    if (normalizedMovies.length === 0) return null;
    return normalizedMovies[0];
  }, [normalizedMovies]);

  // Agrupar filmes por categoria
  const groupByCategory = (items: typeof normalizedMovies) => {
    const map: Record<string, typeof normalizedMovies> = {};
    for (const item of items) {
      if (!map[item.category]) map[item.category] = [];
      if (map[item.category].length < ROW_LIMIT) {
        map[item.category].push(item);
      }
    }
    return map;
  };

  const movieCategories = useMemo(
    () => groupByCategory(normalizedMovies),
    [normalizedMovies]
  );

  const handlePlay = (item: { url?: string; title: string }) => {
    setPlayerMovie({
      url: item.url || "",
      title: item.title,
    });
  };

  const hasContent = movies.length > 0 || series.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onOpenAdmin={() => setShowAdmin(true)} />

      <main>
        <FeaturedHero
          movie={featuredMovie}
          onPlay={featuredMovie ? () => handlePlay(featuredMovie) : undefined}
        />

        <div className="relative z-10 -mt-32 pb-12">
          <div className="container mx-auto space-y-12">
            {/* Séries */}
            {series.length > 0 && (
              <SeriesRow title="Séries" series={series} />
            )}

            {/* Filmes por categoria */}
            {Object.entries(movieCategories).map(([category, items]) => (
              <ContentRow
                key={`movie-${category}`}
                title={category}
                movies={items}
                onPlay={handlePlay}
                seeAllHref={`/category/${encodeURIComponent(category)}`}
              />
            ))}

            {/* Mensagem quando não há conteúdo */}
            {!hasContent && (
              <div className="py-20 text-center">
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-semibold mb-2">Nenhum conteúdo disponível</h3>
                  <p className="text-muted-foreground text-sm">
                    Não há conteúdo publicado no momento. Volte mais tarde!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {playerMovie && (
        <VideoPlayer
          url={playerMovie.url}
          title={playerMovie.title}
          onClose={() => setPlayerMovie(null)}
        />
      )}

      {/* 🔐 Painel Admin - Apenas para admins */}
      {showAdmin && isAdmin && (
        <AdminPanel onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
};

export default Dashboard;
// --- FIM: src/pages/Dashboard.tsx ---