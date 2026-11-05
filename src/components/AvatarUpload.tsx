import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { uploadAvatarFile } from "@/lib/avatar";

type Props = {
  userId: string;
  value?: string | null | undefined;
  name?: string | null | undefined;
  onChange: (path: string | null) => void;
  label?: string;
  hint?: string;
};

/** Circle preview + "choose picture" button; the parent decides when to save the path. */
export function AvatarUpload({ userId, value, name, onChange, label = "الصورة الشخصية", hint = "JPG أو PNG، تُقَصّ تلقائياً بشكل دائري" }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("اختر صورة من نوع JPG أو PNG");
    setBusy(true);
    setError("");
    try {
      onChange(await uploadAvatarFile(userId, file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر رفع الصورة");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar path={value} name={name} className="h-20 w-20" textClass="text-xl" />
        {busy && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-background/70">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary"
          >
            <Camera className="h-4 w-4" />
            {value ? "تغيير الصورة" : "اختيار صورة"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              إزالة
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
