import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateBlockDto {
  @IsNotEmpty()
  @IsString()
  jid: string;

  @IsString()
  @IsIn(['block', 'unblock'])
  action: 'block' | 'unblock';
}
