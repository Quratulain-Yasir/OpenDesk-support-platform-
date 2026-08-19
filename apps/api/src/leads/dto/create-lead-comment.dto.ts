import { IsString, IsNotEmpty } from 'class-validator';

export class CreateLeadCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
