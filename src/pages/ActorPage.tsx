import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPersonDetail, img, type Person } from "@/lib/tmdb";
import PostCard from "@/components/PostCard";

export default function ActorPage() {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<Person | null>(null);

  useEffect(() => {
    if (!id) return;
    getPersonDetail(Number(id)).then(setPerson);
    window.scrollTo(0, 0);
  }, [id]);

  if (!person) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const movies = person.combined_credits?.cast?.filter(m => m.backdrop_path).slice(0, 20) || [];

  return (
    <div className="px-4 sm:px-8 py-6 pb-20">
      <div className="flex gap-6 mb-8">
        <div className="w-32 h-44 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          <img src={img(person.profile_path, "w342")} alt={person.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{person.name}</h1>
          {person.birthday && <p className="text-sm text-muted-foreground mb-1">Born: {person.birthday}</p>}
          {person.place_of_birth && <p className="text-sm text-muted-foreground mb-2">{person.place_of_birth}</p>}
          <p className="text-sm text-muted-foreground">{person.known_for_department}</p>
        </div>
      </div>
      {person.biography && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">Biography</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{person.biography}</p>
        </div>
      )}
      {movies.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Known For</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {movies.map(m => <PostCard key={m.id} item={m} />)}
          </div>
        </div>
      )}
    </div>
  );
}
