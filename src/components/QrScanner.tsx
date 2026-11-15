import { useEffect, useId, useRef, useState } from "react";
import { Camera, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Html5Qrcode as Scanner } from "html5-qrcode";

/** Opens the phone's back camera and reports the first QR code it reads. */
export function QrScanner({ onResult }: { onResult: (text: string) => void }) {
  const id = `qr-${useId().replace(/:/g, "")}`;
  const cb = useRef(onResult);
  cb.current = onResult;
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let scanner: Scanner | undefined;
    let stopped = false;
    let done = false;
    setError("");
    setReady(false);
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (stopped) return;
        scanner = new Html5Qrcode(id);
        await scanner.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: (width, height) => { const size = Math.floor(Math.min(width, height) * 0.75); return { width: size, height: size }; } },
          (text: string) => {
            if (done || stopped) return;
            done = true;
            cb.current(text);
          },
          () => {},
        );
        if (stopped) {
          await scanner.stop();
          scanner.clear();
        } else setReady(true);
      } catch {
        if (!stopped) setError("تعذّر فتح الكاميرا. اسمح للمتصفح باستخدام الكاميرا أو أدخل رقم العضوية يدوياً.");
      }
    })();
    return () => {
      stopped = true;
      const current = scanner;
      if (current?.isScanning) current.stop().then(() => current.clear()).catch(() => {});
    };
  }, [id, attempt]);

  return (
    <div className="w-full min-w-0">
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-lg bg-foreground/90">
        <div id={id} className="h-full w-full [&_video]:h-full [&_video]:object-cover" />
        {!ready && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-primary-foreground">{error ? <Camera className="h-8 w-8" /> : <><Loader2 className="h-8 w-8 animate-spin motion-reduce:animate-none" /><p role="status" className="text-sm">جارٍ فتح الكاميرا...</p></>}</div>}
      </div>
      {error && <div className="mt-3 space-y-3 text-center"><p role="alert" className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={() => setAttempt((value) => value + 1)}><RotateCcw />إعادة فتح الكاميرا</Button></div>}
    </div>
  );
}
