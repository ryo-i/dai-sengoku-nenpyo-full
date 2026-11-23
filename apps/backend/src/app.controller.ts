import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller()
export class AppController {
  /**
   * ルートメッセージを返します。
   */
  @Get()
  @ApiOperation({ summary: 'ルートメッセージを返す' })
  @ApiOkResponse({
    schema: {
      example: { message: 'Welcome to the API!' },
    },
  })
  getRoot() {
    return { message: 'Welcome to the API!' };
  }
}
