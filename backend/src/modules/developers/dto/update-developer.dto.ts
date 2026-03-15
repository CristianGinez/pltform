import { IsOptional, IsString, IsArray, IsNumber, IsUrl, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDeveloperDto {
  @ApiPropertyOptional({ example: 'Juan García' })
  @IsOptional() @IsString() name?: string;

  @ApiPropertyOptional({ example: 'Full-stack developer con 5 años de experiencia' })
  @IsOptional() @IsString() bio?: string;

  @ApiPropertyOptional({ example: ['React', 'Node.js', 'TypeScript'] })
  @IsOptional() @IsArray() skills?: string[];

  @ApiPropertyOptional({ example: 25.00 })
  @IsOptional() @IsNumber() hourlyRate?: number;

  @ApiPropertyOptional({ example: 'https://portfolio.dev' })
  @IsOptional() @IsUrl() portfolioUrl?: string;

  @ApiPropertyOptional({ example: 'https://github.com/dev' })
  @IsOptional() @IsUrl() githubUrl?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/dev' })
  @IsOptional() @IsUrl() linkedinUrl?: string;

  @ApiPropertyOptional({ example: 'Lima, Perú' })
  @IsOptional() @IsString() location?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/...' })
  @IsOptional() @IsUrl() avatarUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean() available?: boolean;

  @ApiPropertyOptional({ example: 'Universidad Nacional de Ingeniería' })
  @IsOptional() @IsString() university?: string;

  @ApiPropertyOptional({ example: '8vo ciclo' })
  @IsOptional() @IsString() cycle?: string;

  @ApiPropertyOptional({ example: ['Frontend', 'Mobile'] })
  @IsOptional() @IsArray() specialtyBadges?: string[];

  @ApiPropertyOptional({ example: '10487654321' })
  @IsOptional() @IsString() ruc?: string;

  @ApiPropertyOptional({ example: 30, description: 'Días de garantía post-entrega' })
  @IsOptional() @IsInt() @Min(0) warrantyDays?: number;
}
