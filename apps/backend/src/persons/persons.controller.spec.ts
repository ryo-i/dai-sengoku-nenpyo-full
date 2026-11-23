import { Test, TestingModule } from '@nestjs/testing';
import { PersonsController } from './persons.controller';
import { PersonsService } from './persons.service';

describe('PersonsController', () => {
  let personsController: PersonsController;
  let personsService: PersonsService;

  beforeEach(async () => {
    const personsServiceMock = {
      getPersons: jest.fn().mockResolvedValue([
        { id: 1, name: '織田信長' },
        { id: 2, name: '豊臣秀吉' },
        { id: 3, name: '徳川家康' },
      ]),
      createPerson: jest.fn().mockResolvedValue({
        id: 4,
        name: '明智光秀',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonsController],
      providers: [{ provide: PersonsService, useValue: personsServiceMock }],
    }).compile();

    personsController = module.get<PersonsController>(PersonsController);
    personsService = module.get<PersonsService>(PersonsService);
  });

  it('should return a list of persons', async () => {
    const result = await personsController.getPersons();
    expect(result).toEqual([
      { id: 1, name: '織田信長' },
      { id: 2, name: '豊臣秀吉' },
      { id: 3, name: '徳川家康' },
    ]);
    expect(personsService.getPersons).toHaveBeenCalled();
  });

  it('should create a person', async () => {
    const result = await personsController.createPerson({
      name: '明智光秀',
    } as any);

    expect(result).toEqual({ id: 4, name: '明智光秀' });
    expect(personsService.createPerson).toHaveBeenCalledWith({
      name: '明智光秀',
    });
  });
});
