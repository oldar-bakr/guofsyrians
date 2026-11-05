import { useEffect, useRef, useState } from "react";

/** Opens the phone's back camera and reports the first QR code it reads. */
export function QrScanner({ onResult }: { onResult: (text: string) => void }) {
  const id = useRef(`qr-${Math.random().toString(36).slice(2)}`).current;
  const cb = useRef(onResult);
  cb.current = onResult;
  const [error, setError] = useState("");

  useEffect(() => {
    let scanner: any;
    let stopped = false;
    let done = false;
    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (stopped) return;
      scanner = new Html5Qrcode(id);
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          (text: string) => {
            if (done) return;
            done = true;
            cb.current(text);
          },
          () => {},
        );
      } catch {
        setError("تعذّر فتح الكاميرا. اسمح للمتصفح باستخدام الكاميرا أو أدخل رقم العضوية يدوياً.");
      }
    })();
    return () => {
      stopped = true;
      if (scanner?.isScanning) scanner.stop().then(() => scanner.clear()).catch(() => {});
    };
  }, [id]);

  return (
    <div>
      <div id={id} className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-foreground/90" />
      {error && <p className="mt-2 text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}
