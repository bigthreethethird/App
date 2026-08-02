import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  nfcId: string;
  message: string;
  history?: ChatMessage[];
}

const FALLBACK_REPLY =
  "I'm not fully configured yet, but I'd be happy to help once the AI service is connected! In the meantime, check out the detailed product information above.";
const PRODUCT_NOT_FOUND =
  "I couldn't find information about this product in our system yet.";

@Injectable()
export class ChatService {
  private readonly requests = new Map<string, { count: number; started: number }>();
  private readonly openai: OpenAI | null;

  constructor(private readonly prisma: PrismaService) {
    this.openai = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
  }

  private rateLimit(ip: string) {
    const now = Date.now();
    const current = this.requests.get(ip);
    if (!current || now - current.started >= 60_000) {
      this.requests.set(ip, { count: 1, started: now });
      return;
    }
    current.count += 1;
    if (current.count > 10) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private list(value: string | null | undefined): string {
    if (!value) return 'Not specified';
    const parts = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length ? parts.join(', ') : 'Not specified';
  }

  private topTerpenes(data: string | null | undefined): string {
    if (!data) return 'Not specified';
    try {
      const parsed = JSON.parse(data) as Record<string, number>;
      return Object.entries(parsed)
        .filter(([, v]) => typeof v === 'number' && v > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, pct]) => `${name} ${pct}%`)
        .join(', ') || 'Not specified';
    } catch {
      return 'Not specified';
    }
  }

  private buildSystemPrompt(product: any): string {
    const { brand, cannabinoidProfile: c, terpeneProfile } = product;
    return [
      'You are a knowledgeable cannabis budtender assistant for Cannect. You\'re helping a consumer learn about this specific product:',
      '',
      `Product: ${product.name} by ${brand?.name || 'the brand'}`,
      `Strain: ${product.strain || 'Not specified'} (${product.strainType || 'Not specified'})`,
      `Genetics: ${product.genetics || 'Not specified'}`,
      `THC: ${c?.thc ?? 0}% | CBD: ${c?.cbd ?? 0}%`,
      `Top Terpenes: ${this.topTerpenes(terpeneProfile?.data)}`,
      `Effects: ${this.list(product.effects)}`,
      `Flavors: ${this.list(product.flavors)}`,
      `Grower: ${product.grower || brand?.name || 'Not specified'}`,
      `Cultivation: ${product.cultivationMethod || 'Not specified'}`,
      '',
      'Be helpful, concise, and educational. NEVER give medical advice. If asked about medical effects, dosing, or health conditions, politely explain you can\'t provide medical advice and suggest consulting a healthcare professional.',
    ].join('\n');
  }

  async ask(req: ChatRequest, ip: string) {
    this.rateLimit(ip);
    if (!req.nfcId || !req.message) {
      throw new HttpException('nfcId and message are required', HttpStatus.BAD_REQUEST);
    }

    const product = await this.prisma.product.findUnique({
      where: { nfcId: req.nfcId },
      include: { brand: true, cannabinoidProfile: true, terpeneProfile: true },
    });
    if (!product) return { reply: PRODUCT_NOT_FOUND };

    const system = this.buildSystemPrompt(product);
    if (!this.openai) return { reply: FALLBACK_REPLY };

    const history = (req.history || []).slice(-10);
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: system },
      ...history.map((m) =>
        m.role === 'user'
          ? ({ role: 'user', content: m.content } as const)
          : ({ role: 'assistant', content: m.content } as const),
      ),
      { role: 'user', content: req.message },
    ];

    try {
      const res = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 300,
        temperature: 0.7,
      });
      const reply = res.choices?.[0]?.message?.content?.trim();
      return { reply: reply || FALLBACK_REPLY };
    } catch {
      return { reply: FALLBACK_REPLY };
    }
  }
}
