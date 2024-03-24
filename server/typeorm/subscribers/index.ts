import { EventSubscriber, EntitySubscriberInterface } from 'typeorm';
import { AfterQueryEvent } from 'typeorm/subscriber/event/QueryEvent';

@EventSubscriber()
export class QuerySubscriber implements EntitySubscriberInterface {
  afterQuery(event: AfterQueryEvent<any>): void | Promise<any> {
    console.log('afterQuery', event.query);
  }
}