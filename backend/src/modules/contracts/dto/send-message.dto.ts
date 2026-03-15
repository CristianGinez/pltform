import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: 'Hola, tengo una pregunta sobre el milestone 2' })
  @IsString() @MinLength(1) content: string;
}
