import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useBookStore } from "@/stores/bookStore";
import { useNavigate } from "react-router-dom";
import type { Book } from "@/types";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UploadStep = "uploading" | "complete" | "error";

const ACCEPTED_TYPES = [".pdf", ".epub", ".txt"];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

const stepConfig: Record<
  UploadStep,
  { label: string; icon: React.ElementType }
> = {
  uploading: { label: "正在上传文件…", icon: Upload },
  complete: { label: "上传完成！", icon: CheckCircle2 },
  error: { label: "上传失败", icon: AlertCircle },
};

const UploadModal = ({ open, onOpenChange }: UploadModalProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState<UploadStep | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadBook = useBookStore((s) => s.uploadBook);
  const navigate = useNavigate();

  const reset = () => {
    setSelectedFile(null);
    setStep(null);
    setUploadProgress(0);
    setError(null);
  };

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) {
      return "不支持的文件格式，请上传 PDF、EPUB 或 TXT 文件";
    }
    if (file.size > MAX_SIZE) {
      return "文件大小不能超过 100MB";
    }
    return null;
  };

  const handleFile = (file: File) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setError(null);

    try {
      setStep("uploading");
      setUploadProgress(0);

      // Extract title from filename
      const title = selectedFile.name.replace(/\.(pdf|epub|txt)$/i, "");

      // Upload to backend with progress callback
      const newBook = await uploadBook(
        selectedFile,
        {
          title,
          author: "未知作者",
        },
        (progress) => {
          setUploadProgress(progress);
        }
      );

      setStep("complete");
      setUploadProgress(100);

      // Auto-navigate after a short delay
      setTimeout(() => {
        onOpenChange(false);
        reset();
        navigate(`/reader/${newBook.id}`);
      }, 1000);
    } catch (err: any) {
      setStep("error");
      setError(err.message || "上传处理失败，请重试");
    }
  };

  const isProcessing = step && step !== "complete" && step !== "error";
  const currentStep = step ? stepConfig[step] : null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isProcessing) {
          onOpenChange(v);
          if (!v) reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-reading text-lg">上传新书</DialogTitle>
        </DialogHeader>

        {/* Processing state */}
        {step && step !== "error" ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div
              className={`rounded-full p-3 ${
                step === "complete"
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step === "complete" ? (
                <CheckCircle2 className="h-8 w-8 text-primary" />
              ) : (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {currentStep?.label}
              </p>
              {selectedFile && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedFile.name}
                </p>
              )}
              {step === "uploading" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {uploadProgress}%
                </p>
              )}
            </div>
            <Progress
              value={step === "complete" ? 100 : uploadProgress}
              className="h-1.5 w-full max-w-xs"
            />
            {step === "complete" && (
              <p className="text-xs text-muted-foreground animate-fade-in">
                即将进入阅读…
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragOver
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/50 hover:bg-accent/50"
              }`}
            >
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-foreground">
                拖放文件到此处，或点击选择
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                支持 PDF、EPUB、TXT 格式，最大 100MB
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.epub,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Selected file */}
            {selectedFile && (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3 animate-fade-in">
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  reset();
                }}
              >
                取消
              </Button>
              <Button
                size="sm"
                disabled={!selectedFile}
                onClick={handleUpload}
              >
                开始处理
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
