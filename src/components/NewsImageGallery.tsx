import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ImageOff, Loader2, Maximize2 } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { resolveContentImages } from "@/lib/content-images";

function Gallery({ paths, urls, title, loading, initial = 0, expanded = false, onExpand }: { paths: string[]; urls: string[]; title: string; loading: boolean; initial?: number; expanded?: boolean; onExpand?: (index: number) => void }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(initial);
  useEffect(() => {
    if (!api) return;
    const update = () => setCurrent(api.selectedScrollSnap());
    update(); api.on("select", update); api.on("reInit", update);
    return () => { api.off("select", update); api.off("reInit", update); };
  }, [api]);
  return <div className="min-w-0">
    <Carousel dir="rtl" opts={{ direction: "rtl", startIndex: initial }} setApi={setApi} aria-label={expanded ? "صور الخبر المكبّرة" : "صور الخبر"}>
      <CarouselContent className="ml-0">
        {paths.map((path, index) => <CarouselItem key={`${path}-${index}`} className="pl-0" aria-label={`الصورة ${index + 1} من ${paths.length}`}>
          <div className={`relative grid w-full place-items-center overflow-hidden rounded-lg bg-muted ${expanded ? "h-[65dvh]" : "h-[280px] sm:h-[420px]"}`}>
            {urls[index] ? <img src={urls[index]} alt={`${title} — صورة ${index + 1}`} draggable={false} className={`h-full w-full select-none ${expanded ? "object-contain" : "object-cover"}`} /> : loading ? <Skeleton className="h-full w-full" /> : <ImageOff className="text-muted-foreground" />}
            {onExpand && <Button variant="secondary" size="icon" disabled={!urls[index]} className="absolute bottom-3 left-3 h-8 w-8" onClick={() => onExpand(index)} aria-label={`تكبير الصورة ${index + 1}`} title="تكبير الصورة"><Maximize2 className="h-4 w-4" /></Button>}
          </div>
        </CarouselItem>)}
      </CarouselContent>
    </Carousel>
    {paths.length > 1 && <div className="mt-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-1"><Button variant="outline" size="icon" className="h-8 w-8" disabled={current === 0} onClick={() => api?.scrollPrev()} aria-label="الصورة السابقة" title="الصورة السابقة"><ChevronRight /></Button><Button variant="outline" size="icon" className="h-8 w-8" disabled={current === paths.length - 1} onClick={() => api?.scrollNext()} aria-label="الصورة التالية" title="الصورة التالية"><ChevronLeft /></Button></div>
      <span role="status" aria-live="polite" className="text-xs text-muted-foreground">{current + 1} / {paths.length}</span>
    </div>}
  </div>;
}

export function NewsImageGallery({ paths = [], title }: { paths?: string[]; title: string }) {
  const { data: urls = [], isPending, isError } = useQuery({ queryKey: ["content-images", paths], queryFn: () => resolveContentImages(paths), enabled: paths.length > 0, staleTime: 30 * 60 * 1000 });
  const [expanded, setExpanded] = useState<number | null>(null);
  if (!paths.length) return null;
  return <div className="mt-4">
    <Gallery paths={paths} urls={urls} title={title} loading={isPending} onExpand={setExpanded} />
    {isError && <p className="mt-2 text-xs text-destructive">تعذّر تحميل الصور</p>}
    <Dialog open={expanded !== null} onOpenChange={(open) => { if (!open) setExpanded(null); }}><DialogContent dir="rtl" className="max-w-4xl"><DialogTitle className="sr-only">{title}</DialogTitle>{expanded !== null && <Gallery paths={paths} urls={urls} title={title} loading={isPending} initial={expanded} expanded />}</DialogContent></Dialog>
  </div>;
}