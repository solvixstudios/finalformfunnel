import { Toaster as Sonner, toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";

const Toaster = ({ ...props }: React.ComponentProps<typeof Sonner>) => {
  return (
    <Sonner
      position="bottom-right"
      expand={false}
      richColors
      gap={8}
      duration={4000}
      closeButton
      icons={{
        success: <CheckCircle2 size={18} className="text-emerald-500" />,
        error: <XCircle size={18} className="text-red-500" />,
        warning: <AlertTriangle size={18} className="text-amber-500" />,
        info: <Info size={18} className="text-blue-500" />,
        loading: <Loader2 size={18} className="text-slate-500 animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "w-[356px] flex items-start gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl font-[Plus_Jakarta_Sans,sans-serif] transition-all",
          title: "text-[13px] font-bold leading-snug",
          description: "text-[11px] font-medium opacity-70 leading-relaxed mt-0.5",
          actionButton:
            "text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors",
          cancelButton:
            "text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors",
          closeButton:
            "!bg-transparent !border-0 !shadow-none opacity-40 hover:opacity-100 transition-opacity !text-current !top-2 !right-2",
          icon: "mt-0.5 shrink-0",
          success:
            "bg-gradient-to-br from-white to-emerald-50/80 border-emerald-200/60 text-slate-900 shadow-emerald-500/10 ring-1 ring-emerald-100/50",
          error:
            "bg-gradient-to-br from-white to-red-50/80 border-red-200/60 text-slate-900 shadow-red-500/10 ring-1 ring-red-100/50",
          warning:
            "bg-gradient-to-br from-white to-amber-50/80 border-amber-200/60 text-slate-900 shadow-amber-500/10 ring-1 ring-amber-100/50",
          info:
            "bg-gradient-to-br from-white to-blue-50/80 border-blue-200/60 text-slate-900 shadow-blue-500/10 ring-1 ring-blue-100/50",
          loading:
            "bg-gradient-to-br from-white to-slate-50/80 border-slate-200/60 text-slate-900 shadow-slate-500/10 ring-1 ring-slate-100/50",
          default:
            "bg-gradient-to-br from-white to-slate-50/80 border-slate-200/60 text-slate-900 shadow-slate-500/8 ring-1 ring-slate-100/50",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
