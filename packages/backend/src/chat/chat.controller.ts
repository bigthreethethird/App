import { Body, Controller, Post, Req } from '@nestjs/common';
import { ChatRequest, ChatService } from './chat.service';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Post()
  create(@Body() body: ChatRequest, @Req() req: any) {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    return this.service.ask(body, ip);
  }
}
