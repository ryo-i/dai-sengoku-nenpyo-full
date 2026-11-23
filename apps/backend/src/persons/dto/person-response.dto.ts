import { ApiProperty, ApiSchema } from '@nestjs/swagger';

/**
 * Person 作成・取得 API のレスポンス型。
 */
@ApiSchema({ name: 'Person' })
export class PersonResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '織田信長' })
  name: string;
}
