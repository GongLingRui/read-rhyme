/**
 * Voice Reference Component
 * Professional voice direction terminology and guidance
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check, Search, BookOpen, Sparkles, Mic, Music, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceTerm {
  term: string;
  description: string;
  examples?: string[];
}

const voiceCategories = {
  texture: {
    name: "音质与音色",
    icon: Music,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    terms: [
      { term: "Breathy", description: "带有呼吸声的，轻盈的", examples: ["低语般的", "气声"] },
      { term: "Raspy", description: "沙哑的，粗糙的", examples: ["嘶哑", "沙哑"] },
      { term: "Smooth", description: "平滑的，流畅的", examples: ["圆润", "流畅"] },
      { term: "Crisp", description: "清脆的，清晰的", examples: ["清脆", "清晰"] },
      { term: "Warm", description: "温暖的，亲切的", examples: ["温暖", "亲切"] },
      { term: "Bright", description: "明亮的，活泼的", examples: ["明亮", "活泼"] },
      { term: "Dark", description: "深沉的，厚重的", examples: ["深沉", "厚重"] },
      { term: "Thin", description: "单薄的，缺乏共鸣的", examples: ["单薄"] },
      { term: "Full", description: "饱满的，丰富的", examples: ["饱满", "丰富"] },
      { term: "Nasal", description: "鼻音重的", examples: ["鼻音"] },
      { term: "Chesty", description: "胸腔共鸣的", examples: ["胸腔音"] },
      { term: "Heady", description: "头腔共鸣的", examples: ["头腔音"] },
    ] as VoiceTerm[],
  },
  emotion: {
    name: "情感与态度",
    icon: Sparkles,
    color: "bg-pink-100 text-pink-800 border-pink-200",
    terms: [
      { term: "Sincere", description: "真诚的，诚恳的", examples: ["真诚", "诚恳"] },
      { term: "Sarcastic", description: "讽刺的，嘲讽的", examples: ["讽刺", "嘲讽"] },
      { term: "Melancholic", description: "忧郁的，悲伤的", examples: ["忧郁", "悲伤"] },
      { term: "Joyful", description: "快乐的，欢欣的", examples: ["快乐", "欢欣"] },
      { term: "Tender", description: "温柔的，慈爱的", examples: ["温柔", "慈爱"] },
      { term: "Firm", description: "坚定的，有力的", examples: ["坚定", "有力"] },
      { term: "Hesitant", description: "犹豫的，迟疑的", examples: ["犹豫", "迟疑"] },
      { term: "Confident", description: "自信的，确信的", examples: ["自信", "确信"] },
      { term: "Anxious", description: "焦虑的，不安的", examples: ["焦虑", "不安"] },
      { term: "Calm", description: "平静的，冷静的", examples: ["平静", "冷静"] },
      { term: "Excited", description: "兴奋的，激动的", examples: ["兴奋", "激动"] },
      { term: "Bored", description: "无聊的，厌倦的", examples: ["无聊", "厌倦"] },
    ] as VoiceTerm[],
  },
  delivery: {
    name: "表达方式",
    icon: Mic,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    terms: [
      { term: "Whispered", description: "低语的，耳语的", examples: ["低语", "耳语"] },
      { term: "Projected", description: "投射的，洪亮的", examples: ["洪亮", "投射"] },
      { term: "Clipped", description: "急促的，省略的", examples: ["急促", "省略"] },
      { term: "Drawled", description: "拉长音的，慢吞吞的", examples: ["拖长音", "慢吞吞"] },
      { term: "Staccato", description: "断奏的，跳音的", examples: ["断奏", "跳音"] },
      { term: "Legato", description: "连贯的，流畅的", examples: ["连贯", "流畅"] },
      { term: "Punchy", description: "有力的，突出的", examples: ["有力", "突出"] },
      { term: "Subtle", description: "微妙的，含蓄的", examples: ["微妙", "含蓄"] },
      { term: "Dramatic", description: "戏剧性的", examples: ["戏剧性"] },
      { term: "Deadpan", description: "面无表情的，单调的", examples: ["面无表情", "单调"] },
      { term: "Over-the-top", description: "夸张的，过度的", examples: ["夸张", "过度"] },
      { term: "Understated", description: "低调的，含蓄的", examples: ["低调", "含蓄"] },
    ] as VoiceTerm[],
  },
  pacing: {
    name: "节奏与速度",
    icon: Zap,
    color: "bg-green-100 text-green-800 border-green-200",
    terms: [
      { term: "Rapid", description: "快速的，急速的", examples: ["快速", "急速"] },
      { term: "Leisurely", description: "悠闲的，缓慢的", examples: ["悠闲", "缓慢"] },
      { term: "Measured", description: "稳健的，有节制的", examples: ["稳健", "有节制"] },
      { term: "Hurried", description: "匆忙的，急促的", examples: ["匆忙", "急促"] },
      { term: "Paused", description: "停顿的，间断的", examples: ["停顿", "间断"] },
      { term: "Flowing", description: "流畅的，连续的", examples: ["流畅", "连续"] },
      { term: "Tripping", description: "轻快的，跳跃的", examples: ["轻快", "跳跃"] },
      { term: "Dragging", description: "拖沓的，迟缓的", examples: ["拖沓", "迟缓"] },
      { term: "Crisp", description: "利落的，干脆的", examples: ["利落", "干脆"] },
      { term: "Relaxed", description: "放松的，松散的", examples: ["放松", "松散"] },
      { term: "Urgent", description: "紧急的，迫切的", examples: ["紧急", "迫切"] },
      { term: "Languid", description: "慵懒的，缓慢的", examples: ["慵懒", "缓慢"] },
    ] as VoiceTerm[],
  },
  archetypes: {
    name: "角色原型",
    icon: BookOpen,
    color: "bg-orange-100 text-orange-800 border-orange-200",
    terms: [
      { term: "Announcer", description: "播音员风格，清晰专业", examples: ["播音员", "主持人"] },
      { term: "Conversational", description: "对话风格，自然亲切", examples: ["对话", "自然"] },
      { term: "Narrator", description: "旁白风格，客观叙述", examples: ["旁白", "叙述"] },
      { term: "Character", description: "角色扮演，生动活泼", examples: ["角色扮演", "生动"] },
      { term: "Professional", description: "专业风格，正式严肃", examples: ["专业", "正式"] },
      { term: "Friendly", description: "友好风格，热情亲切", examples: ["友好", "热情"] },
      { term: "Authoritative", description: "权威风格，命令式", examples: ["权威", "命令"] },
      { term: "Casual", description: "随意风格，轻松自然", examples: ["随意", "轻松"] },
      { term: "Dramatic", description: "戏剧风格，夸张表现", examples: ["戏剧", "夸张"] },
      { term: "Intimate", description: "亲密风格，低声细语", examples: ["亲密", "低语"] },
      { term: "Energetic", description: "活力风格，充满能量", examples: ["活力", "能量"] },
      { term: "Soothing", description: "抚慰风格，平静安宁", examples: ["抚慰", "平静"] },
    ] as VoiceTerm[],
  },
};

export function VoiceReference() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedTerm, setCopiedTerm] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("texture");

  const handleCopy = (term: string) => {
    navigator.clipboard.writeText(term);
    setCopiedTerm(term);
    toast({
      title: "已复制",
      description: `已复制: ${term}`,
    });
    setTimeout(() => setCopiedTerm(null), 2000);
  };

  const filterTerms = (terms: VoiceTerm[]) => {
    if (!searchQuery) return terms;
    const query = searchQuery.toLowerCase();
    return terms.filter(
      (t) =>
        t.term.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.examples?.some((e) => e.toLowerCase().includes(query))
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          语音参考词汇库
        </CardTitle>
        <CardDescription>
          专业语音指导术语，点击复制使用
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索术语..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Categories */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid w-full grid-cols-5 mb-4">
            {Object.entries(voiceCategories).map(([key, cat]) => {
              const Icon = cat.icon;
              return (
                <TabsTrigger key={key} value={key} className="gap-1">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{cat.name.split(" ")[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(voiceCategories).map(([key, category]) => {
            const Icon = category.icon;
            const filteredTerms = filterTerms(category.terms);

            return (
              <TabsContent key={key} value={key}>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3 pr-4">
                    {filteredTerms.map((item) => (
                      <Card
                        key={item.term}
                        className="group hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={category.color}>
                                  <Icon className="h-3 w-3 mr-1" />
                                  {item.term}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {item.description}
                              </p>
                              {item.examples && item.examples.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {item.examples.map((example) => (
                                    <Badge
                                      key={example}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {example}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(item.term)}
                              className="flex-shrink-0"
                            >
                              {copiedTerm === item.term ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Quick Reference */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">快速参考</p>
          <p className="text-xs text-muted-foreground">
            点击任意术语复制到剪贴板，可在脚本编辑器的"语音指导"字段中使用。
            这些术语源自专业配音和语音表演行业标准。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
