import { type UploadedBook } from "@/stores/bookStore";

export interface UploadApiResponse {
  sections: string[];
  audio_url: string;
  metadata: {
    title: string;
    author: string;
  };
}

// Simulate file reading and parsing
const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsText(file);
  });
};

// Split content into sections (paragraphs)
const splitIntoSections = (text: string): string[] => {
  return text
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

// Extract a rough title from content
const extractMetadata = (
  fileName: string,
  content: string
): { title: string; author: string } => {
  const nameWithoutExt = fileName.replace(/\.(pdf|epub|txt)$/i, "");
  const firstLine = content.split("\n")[0]?.replace(/^#+\s*/, "").trim();
  return {
    title: firstLine && firstLine.length < 50 ? firstLine : nameWithoutExt,
    author: "未知作者",
  };
};

type ProgressCallback = (step: UploadStep) => void;

export type UploadStep =
  | "uploading"
  | "parsing"
  | "generating_audio"
  | "complete"
  | "error";

export const simulateUpload = async (
  file: File,
  onProgress: ProgressCallback
): Promise<UploadApiResponse> => {
  // Step 1: Uploading
  onProgress("uploading");
  await delay(800);

  // Step 2: Parsing content
  onProgress("parsing");
  let content: string;
  try {
    content = await readFileContent(file);
  } catch {
    content = generateFallbackContent(file.name);
  }
  await delay(1200);

  const sections = splitIntoSections(content);
  const metadata = extractMetadata(file.name, content);

  // Step 3: Generating audio
  onProgress("generating_audio");
  await delay(2000);

  // Step 4: Complete
  onProgress("complete");

  return {
    sections: sections.length > 0 ? sections : generateFallbackSections(),
    audio_url: `https://mock-audio.example.com/${file.name}.mp3`,
    metadata,
  };
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const generateFallbackContent = (fileName: string): string => {
  return `# ${fileName.replace(/\.\w+$/, "")}

这是一份由系统自动生成的示例内容。原始文件格式暂不支持直接解析，请上传 TXT 格式的纯文本文件以获得最佳体验。

## 第一章 引言

每一本书都是一次旅程。阅读让我们穿越时空，与不同时代的思想者对话。在这个数字时代，AI 技术正在重新定义我们与文字互动的方式。

## 第二章 探索

知识的积累是渐进的。每一个段落、每一个概念都是通往更深理解的阶梯。让我们一起在文字的海洋中探索未知的领域。`;
};

const generateFallbackSections = (): string[] => [
  "## 第一章 引言",
  "这是一份示例内容。请上传 TXT 格式文件以获得最佳体验。",
  "## 第二章 探索",
  "知识的积累是渐进的，让我们一起探索。",
];
