import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonResponseDto } from './dto/person-response.dto';
import { PersonsService } from './persons.service';

@ApiTags('persons')
@Controller('persons')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  /**
   * 人物一覧を取得するエンドポイントです。
   */
  @Get()
  @ApiOperation({ summary: '人物一覧を取得する' })
  @ApiOkResponse({ type: PersonResponseDto, isArray: true })
  async getPersons() {
    return await this.personsService.getPersons();
  }

  /**
   * 人物を作成するエンドポイントです。
   */
  @Post()
  @ApiOperation({ summary: '人物を作成する' })
  @ApiBody({ type: CreatePersonDto })
  @ApiCreatedResponse({ type: PersonResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async createPerson(@Body() createPersonDto: CreatePersonDto) {
    return await this.personsService.createPerson(createPersonDto);
  }
}
