import { Injectable } from '@nestjs/common';
import { AmqpConnection, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { EmitService } from './emit.service';
import {
  CreateCardDto,
  UpdateCardDto,
  DeleteCardDto,
  MoveCardDto,
  GetCardDto,
  CardResultMessage,
} from './dto/card.dto';

@Injectable()
export class CardService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly emitService: EmitService,
  ) {}

  createCard(data: CreateCardDto) {
    return this.amqpConnection.publish('realtime-exchange', 'card.create', data);
  }

  updateCard(data: UpdateCardDto) {
    return this.amqpConnection.publish('realtime-exchange', 'card.update', data);
  }

  deleteCard(data: DeleteCardDto) {
    return this.amqpConnection.publish('realtime-exchange', 'card.delete', data);
  }

  moveCard(data: MoveCardDto) {
    return this.amqpConnection.publish('realtime-exchange', 'card.move', data);
  }

  getCard(data: GetCardDto) {
    return this.amqpConnection.publish('realtime-exchange', 'card.get', data);
  }
}
