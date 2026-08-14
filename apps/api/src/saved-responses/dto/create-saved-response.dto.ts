import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateSavedResponseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(5)
  content: string;

  @IsString()
  @IsOptional()
  category?: string;
}
