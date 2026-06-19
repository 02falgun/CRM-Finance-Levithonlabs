import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@levithonlabs.com', description: 'Corporate email address associated with the account' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
