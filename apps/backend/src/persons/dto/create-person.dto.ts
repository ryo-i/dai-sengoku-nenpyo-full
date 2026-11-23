import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Person 作成時のリクエストボディ。
 * Swagger とバリデーションの両方で利用します。
 */
export class CreatePersonDto {
  @ApiProperty({ example: '織田信長', description: '人物名' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
