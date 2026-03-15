import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token obtenido en login/register' })
  @IsString()
  refresh_token: string;
}
