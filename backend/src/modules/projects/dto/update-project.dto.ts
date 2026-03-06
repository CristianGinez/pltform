import { IsString, IsOptional, IsNumber, IsArray, IsDateString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(10)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(50)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  budget?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  category?: string;
}
