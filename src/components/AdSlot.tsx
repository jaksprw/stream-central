import { useAds } from "@/lib/ads";

interface Props {
  slot: string;
  className?: string;
}

export default function AdSlot({ slot, className = "" }: Props) {
  const ads = useAds(slot);
  if (!ads.length) return null;
  return (
    <div className={`w-full flex flex-col items-center gap-3 my-4 ${className}`}>
      {ads.map(ad => {
        if (ad.html) {
          return (
            <div
              key={ad.id}
              className="w-full max-w-3xl flex justify-center overflow-hidden"
              dangerouslySetInnerHTML={{ __html: ad.html }}
            />
          );
        }
        if (ad.image_url) {
          const img = (
            <img src={ad.image_url} alt={ad.name} className="max-w-full h-auto rounded-lg" loading="lazy" />
          );
          return ad.click_url ? (
            <a key={ad.id} href={ad.click_url} target="_blank" rel="noopener sponsored" className="block max-w-3xl">
              {img}
            </a>
          ) : (
            <div key={ad.id} className="max-w-3xl">{img}</div>
          );
        }
        return null;
      })}
    </div>
  );
}
