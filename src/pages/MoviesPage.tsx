import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContent } from "@/contexts/ContentContext";
import { useAuth } from "@/contexts/AuthContext";
import DashboardHeader from "@/components/DashboardHeader";
import MovieCard from "@/components/MovieCard";
import Footer from "@/components/Footer";
import VideoPlayer from "@/components/VideoPlayer";
import AdminPanel from "@/components/AdminPanel";

const MoviesPage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { publishedMovies } = useContent();
  
  const [playerMovie, setPlayerMovie] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  const handlePlay = (movie: { url: string; title: string }) => {
    setPlayerMovie(movie);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onOpenAdmin={() => setShowAdmin(true)} />
      
      <div className="pt-20 px-4 pb-12">
        <div className="container mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-primary hover:underline mb-4"
            >
              ← Voltar
            </button>
            <h1 className="text-3xl font-bold mb-2">Filmes</h1>
            <p className="text-muted-foreground">
              {publishedMovies.length} {publishedMovies.length === 1 ? 'filme disponível' : 'filmes disponíveis'}
            </p>
          </div>

          {/* Grid de filmes */}
          {publishedMovies.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-muted-foreground text-lg">
                Nenhum filme disponível no momento
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {publishedMovies.map((movie, index) => (
                <MovieCard
                  key={movie.id}
                  title={movie.title}
                  image={movie.image}
                  year={""}
                  duration={""}
                  rating={""}
                  delay={index * 0.03}
                  onPlay={() => handlePlay({ url: movie.url, title: movie.title })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Video Player */}
      {playerMovie && (
        <VideoPlayer
          url={playerMovie.url}
          title={playerMovie.title}
          onClose={() => setPlayerMovie(null)}
        />
      )}

      {/* Admin Panel */}
      {showAdmin && isAdmin && (
        <AdminPanel onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
};

export default MoviesPage;