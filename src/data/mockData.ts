import bookCover1 from "@/assets/book-cover-1.jpg";
import bookCover2 from "@/assets/book-cover-2.jpg";
import bookCover3 from "@/assets/book-cover-3.jpg";
import bookCover4 from "@/assets/book-cover-4.jpg";

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  progress: number;
  totalChapters: number;
  currentChapter: number;
}

export interface Highlight {
  id: string;
  text: string;
  note?: string;
  chapter: string;
  createdAt: string;
  color: "yellow" | "blue" | "green";
}

export interface Chapter {
  id: string;
  title: string;
  level: number;
}

export const mockBooks: Book[] = [
  {
    id: "1",
    title: "人工智能简史",
    author: "尼克",
    cover: bookCover1,
    progress: 68,
    totalChapters: 12,
    currentChapter: 8,
  },
  {
    id: "2",
    title: "沉思录",
    author: "马可·奥勒留",
    cover: bookCover2,
    progress: 35,
    totalChapters: 10,
    currentChapter: 4,
  },
  {
    id: "3",
    title: "创意写作指南",
    author: "叶舟",
    cover: bookCover3,
    progress: 90,
    totalChapters: 8,
    currentChapter: 7,
  },
  {
    id: "4",
    title: "文明的故事",
    author: "威尔·杜兰特",
    cover: bookCover4,
    progress: 12,
    totalChapters: 15,
    currentChapter: 2,
  },
];

export const mockChapters: Chapter[] = [
  { id: "ch1", title: "第一章 什么是人工智能", level: 1 },
  { id: "ch2", title: "1.1 智能的定义", level: 2 },
  { id: "ch3", title: "1.2 图灵测试", level: 2 },
  { id: "ch4", title: "第二章 机器学习基础", level: 1 },
  { id: "ch5", title: "2.1 监督学习", level: 2 },
  { id: "ch6", title: "2.2 无监督学习", level: 2 },
  { id: "ch7", title: "第三章 深度学习", level: 1 },
  { id: "ch8", title: "3.1 神经网络", level: 2 },
  { id: "ch9", title: "3.2 卷积网络", level: 2 },
  { id: "ch10", title: "第四章 自然语言处理", level: 1 },
];

export const mockHighlights: Highlight[] = [
  {
    id: "h1",
    text: "人工智能的本质不在于模仿人类，而在于解决人类无法高效解决的问题。",
    note: "这是一个很好的视角转换",
    chapter: "第一章",
    createdAt: "2024-01-15",
    color: "yellow",
  },
  {
    id: "h2",
    text: "图灵测试的意义不在于机器是否能欺骗人类，而在于它为智能的讨论提供了一个可操作的框架。",
    chapter: "第一章",
    createdAt: "2024-01-16",
    color: "blue",
  },
  {
    id: "h3",
    text: "深度学习的突破证明了一个朴素的道理：数据和算力的积累可以产生质的飞跃。",
    note: "量变到质变",
    chapter: "第三章",
    createdAt: "2024-01-18",
    color: "green",
  },
];

export const mockContent = `## 第一章 什么是人工智能

人工智能（Artificial Intelligence，简称 AI）是计算机科学的一个分支，致力于创建能够执行通常需要人类智能的任务的系统。这些任务包括学习、推理、问题解决、感知和语言理解。

人工智能的本质不在于模仿人类，而在于解决人类无法高效解决的问题。从这个角度来看，AI 更像是人类智慧的延伸，而非替代品。

### 1.1 智能的定义

什么是智能？这个问题在哲学和科学领域已经讨论了数千年。从亚里士多德的逻辑推理，到笛卡尔的理性主义，再到现代认知科学，人类一直在试图理解智能的本质。

在计算机科学的语境下，智能通常被定义为系统适应新环境、从经验中学习、并运用知识来操纵环境的能力。这个定义虽然宽泛，但为我们提供了一个实用的框架。

### 1.2 图灵测试

1950年，艾伦·图灵提出了一个著名的思想实验：如果一台机器能够在对话中让人类无法分辨其是否为机器，那么这台机器就可以被认为具有智能。

图灵测试的意义不在于机器是否能欺骗人类，而在于它为智能的讨论提供了一个可操作的框架。尽管这个测试有其局限性——它主要关注语言能力，忽视了其他形式的智能——但它仍然是 AI 领域最具影响力的概念之一。

## 第二章 机器学习基础

机器学习是人工智能的核心方法之一。与传统的编程方式不同，机器学习让计算机从数据中自动学习模式和规律，而不需要显式地编写规则。

### 2.1 监督学习

监督学习是最常见的机器学习范式。在这种方法中，算法从标记的训练数据中学习，然后对新的、未见过的数据进行预测。常见的监督学习算法包括线性回归、决策树和支持向量机。

### 2.2 无监督学习

与监督学习不同，无监督学习处理的是没有标签的数据。算法需要自行发现数据中的结构和模式。聚类和降维是无监督学习的两种主要方法。`;
