import {Body,Controller,Post} from '@nestjs/common'; import {WaitlistService} from './waitlist.service';
@Controller('api/waitlist') export class WaitlistController{constructor(private service:WaitlistService){} @Post() create(@Body() body:{email:string;brandName?:string;consent?:boolean}){return this.service.create(body.email,body.brandName,body.consent)}}
