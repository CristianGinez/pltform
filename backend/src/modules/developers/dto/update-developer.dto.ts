import { IsOptional, IsString, IsArray, IsNumber, IsUrl, IsBoolean, IsInt, Min } from 'class-validator';

export class UpdateDeveloperDto {
  @IsOptional() @IsString()  name?: string;
  @IsOptional() @IsString()  bio?: string;
  @IsOptional() @IsArray()   skills?: string[];
  @IsOptional() @IsNumber()  hourlyRate?: number;
  @IsOptional() @IsUrl()     portfolioUrl?: string;
  @IsOptional() @IsUrl()     githubUrl?: string;
  @IsOptional() @IsUrl()     linkedinUrl?: string;
  @IsOptional() @IsString()  location?: string;
  @IsOptional() @IsUrl()     avatarUrl?: string;
  @IsOptional() @IsBoolean() available?: boolean;
  @IsOptional() @IsString()  university?: string;
  @IsOptional() @IsString()  cycle?: string;
  @IsOptional() @IsArray()   specialtyBadges?: string[];
  @IsOptional() @IsString()  ruc?: string;
  @IsOptional() @IsInt() @Min(0) warrantyDays?: number;
}
