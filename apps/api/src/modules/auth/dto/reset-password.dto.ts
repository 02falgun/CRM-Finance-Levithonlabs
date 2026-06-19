import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'The JWT reset token sent in the email' })
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'newpassword123', description: 'The new password to set for the account' })
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
