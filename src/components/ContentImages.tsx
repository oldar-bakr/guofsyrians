import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImagePlus, ImageOff, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { resolveContentImages, uploadContentImage } from "@/lib/content-images";

function useImages(paths: string[]) {
  return useQuery({
    queryKey: ["content-images", paths],
    queryFn: () => resolveContentImages(paths),
    enabled: paths.length > 0,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function ContentImages({ paths = [], title, cover = false, coverFit = "contain", className = "" }: { paths?: string[]; title: string; cover?: boolean; coverFit?: "contain" | "cover"; className?: string }) {
  const { data: urls = [], isPending, isError } = useImages(paths);
  const [selected, setSelected] = useState<number | null>(null);
  if (!paths.length) return null;
  const display = cover ? paths.slice(0, 1) : paths;
  return (
    <div className={className}>
      <div className={cover ? "" : "grid gap-3 sm:grid-cols-2"}>
        {display.map((path, i) => (
          cover ? (
            <div key={path} className="grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-lg bg-muted">
              {urls[i] ? <img src={urls[i]} alt={title} loading="lazy" className={`h-full w-full ${coverFit === "cover" ? "object-cover" : "object-contain"}`} /> : isPending ? <Loader2 className="animate-spin text-muted-foreground" /> : <ImageOff className="text-muted-foreground" />}
            </div>
          ) : (
            <Button key={path} variant="ghost" className="h-auto w-full overflow-hidden p-0" disabled={!urls[i]} onClick={() => setSelected(i)} aria-label={`عرض صورة ${i + 1} — ${title}`}>
              <span className="grid aspect-[4/3] w-full place-items-center bg-muted">
                {urls[i] ? <img src={urls[i]} alt={`${title} — صورة ${i + 1}`} loading="lazy" className="h-full w-full object-contain" /> : <ImageOff className="text-muted-foreground" />}
              </span>
            </Button>
          )
        ))}
      </div>
      {isError && !cover && <p className="mt-1 text-xs text-destructive">تعذّر تحميل الصور</p>}
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>{title}</DialogTitle>
          {selected !== null && urls[selected] && <img src={urls[selected]} alt={title} className="max-h-[70vh] w-full object-contain" />}
          {paths.length > 1 && <div className="flex flex-wrap justify-center gap-2">{paths.map((path, i) => <Button key={path} size="sm" variant={selected === i ? "default" : "outline"} onClick={() => setSelected(i)}>{i + 1}</Button>)}</div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ContentImageUpload({ value, onChange, onBusyChange }: { value: string[]; onChange: (paths: string[]) => void; onBusyChange: (busy: boolean) => void }) {
  const id = useId();
  const { data: urls = [] } = useImages(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const upload = async (files: File[]) => {
    if (!files.length || busy) return;
    setBusy(true); onBusyChange(true); setError("");
    const next = [...value];
    try {
      for (const file of files) next.push(await uploadContentImage(file));
    } catch (e) { setError(e instanceof Error ? e.message : "تعذّر رفع الصورة"); }
    finally { onChange(next); setBusy(false); onBusyChange(false); }
  };
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">الصور</p>
      <div className="grid grid-cols-3 gap-2">
        {value.map((path, i) => <div key={path} className="relative grid aspect-square place-items-center overflow-hidden rounded-lg border bg-muted">
          {urls[i] && <img src={urls[i]} alt={`الصورة ${i + 1}`} className="h-full w-full object-contain" />}
          <Button type="button" variant="secondary" size="icon" className="absolute left-1 top-1 h-7 w-7" title="إزالة الصورة" aria-label={`إزالة الصورة ${i + 1}`} disabled={busy} onClick={() => onChange(value.filter((p) => p !== path))}><X /></Button>
          {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-card/90 text-center text-xs">صورة الغلاف</span>}
        </div>)}
      </div>
      <input id={id} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} className="sr-only" onChange={(e) => { void upload(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
      <Button type="button" variant="outline" disabled={busy} onClick={() => document.getElementById(id)?.click()}>{busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}{busy ? "جارٍ رفع الصور…" : "إضافة صور"}</Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}