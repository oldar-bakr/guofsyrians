import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Pause, Play } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useContent } from "@/lib/content";
import { resolveContentImages } from "@/lib/content-images";
import type { Database } from "@/integrations/supabase/types";
import logo from "@/assets/union-logo.png.asset.json";

type News = Database["public"]["Tables"]["news"]["Row"];

function NewsSlide({ news }: { news: News }) {
  const paths = news.images.slice(0, 1);
  const { data: urls = [] } = useQuery({
    queryKey: ["content-images", paths],
    queryFn: () => resolveContentImages(paths),
    enabled: paths.length > 0,
    staleTime: 30 * 60 * 1000,
  });
  return <Link to="/news/$id" params={{ id: news.id }} className="relative block h-[260px] overflow-hidden bg-secondary sm:h-[360px]" aria-label={`اقرأ الخبر: ${news.title}`}>
    {urls[0] ? <img src={urls[0]} alt={news.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center pb-24"><img src={logo.url} alt="الاتحاد العام لطلبة سوريا" className="h-28 w-28 object-contain sm:h-36 sm:w-36" /></div>}
    <div className="absolute inset-x-0 bottom-0 flex h-1/3 flex-col justify-center gap-0.5 bg-primary/95 px-4 py-2 text-primary-foreground sm:gap-1 sm:px-7 sm:py-3">
      <div className="flex items-center gap-2 text-[10px] leading-3 sm:text-xs sm:leading-4"><span className="font-bold text-accent">أخبار الاتحاد</span>{news.date && <><span aria-hidden="true">·</span><span>{news.date}</span></>}</div>
      <h2 className="line-clamp-2 break-words font-display text-base font-bold leading-5 sm:text-xl sm:leading-6">{news.title}</h2>
      <span className="inline-flex items-center gap-2 text-[10px] leading-3 text-accent sm:text-xs sm:leading-4">اقرأ الخبر<ArrowLeft className="h-3 w-3" /></span>
    </div>
  </Link>;
}

export function NewsSlider() {
  const { data: news = [], isLoading, isError } = useContent<News>("news");
  const slides = news.slice(0, 6);
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  useEffect(() => {
    if (!api) return;
    const update = () => setSelected(api.selectedScrollSnap());
    update(); api.on("select", update); api.on("reInit", update);
    return () => { api.off("select", update); api.off("reInit", update); };
  }, [api]);
  useEffect(() => {
    if (!api || slides.length < 2 || paused || interacting || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => { if (!document.hidden) api.scrollNext(); }, 6000);
    return () => window.clearInterval(timer);
  }, [api, slides.length, paused, interacting]);
  if (isLoading) return <div className="grid h-[260px] place-items-center rounded-lg bg-secondary sm:h-[360px]" aria-label="تحميل الأخبار"><Loader2 className="animate-spin text-primary" /></div>;
  if (!slides.length) return <section className="flex min-h-48 flex-col items-center justify-center gap-3 bg-secondary py-8 text-center"><img src={logo.url} alt="الاتحاد العام لطلبة سوريا" className="h-16 w-16" /><h2 className="font-display text-xl font-bold">أخبار الاتحاد</h2><p className="text-sm text-muted-foreground">{isError ? "تعذّر تحميل الأخبار حالياً" : "لا توجد أخبار منشورة حالياً"}</p></section>;
  return <section aria-label="آخر أخبار الاتحاد" onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocusCapture={() => setInteracting(true)} onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setInteracting(false); }}>
    <Carousel opts={{ direction: "rtl", loop: slides.length > 1 }} setApi={setApi} aria-label="أخبار الاتحاد" className="overflow-hidden rounded-lg">
      <CarouselContent className="ml-0">
        {slides.map((item, i) => <CarouselItem key={item.id} className="pl-0" aria-label={`خبر ${i + 1} من ${slides.length}`}><NewsSlide news={item} /></CarouselItem>)}
      </CarouselContent>
    </Carousel>
    <div className="mt-3 flex items-center justify-between gap-2">
      {slides.length > 1 ? <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => api?.scrollPrev()} aria-label="الخبر السابق" title="الخبر السابق"><ChevronRight /></Button>
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => api?.scrollNext()} aria-label="الخبر التالي" title="الخبر التالي"><ChevronLeft /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPaused(!paused)} aria-label={paused ? "تشغيل عرض الأخبار" : "إيقاف عرض الأخبار"} title={paused ? "تشغيل" : "إيقاف"}>{paused ? <Play /> : <Pause />}</Button>
      </div> : <span />}
      {slides.length > 1 && <div className="flex items-center gap-1" aria-label="اختيار الخبر">{slides.map((item, i) => <Button key={item.id} variant="ghost" size="icon" className="h-7 w-5 p-0" aria-label={`انتقل للخبر ${i + 1}`} aria-current={selected === i ? "true" : undefined} onClick={() => api?.scrollTo(i)}><span className={`h-1.5 rounded-full transition-all motion-reduce:transition-none ${selected === i ? "w-5 bg-primary" : "w-1.5 bg-primary/25"}`} /></Button>)}</div>}
      <Button asChild variant="link" size="sm" className="px-0"><Link to="/news">كل الأخبار<ArrowLeft /></Link></Button>
    </div>
  </section>;
}