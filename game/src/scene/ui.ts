import {
  Container,
  ContainerOptions,
  EventEmitter,
  FederatedMouseEvent,
  Graphics,
  Text,
} from 'pixi.js';

export enum UIEventName {
  PLACE_BETS = 'place_bets',
  CLEAR_BETS = 'clear_bets',
}

type UIEvent = {
  [UIEventName.PLACE_BETS]: () => void;
  [UIEventName.CLEAR_BETS]: () => void;
};

export class UI extends Container {
  public readonly events: EventEmitter<UIEvent>;
  protected startBtn: Container;
  protected clearBetsBtn: Container;

  constructor(opts?: ContainerOptions) {
    super(opts);
    this.events = new EventEmitter();
  }

  public async init(): Promise<void> {
    this.startBtn = this.createButton('START', 100, 820, () =>
      this.events.emit(UIEventName.PLACE_BETS)
    );
    this.addChild(this.startBtn);

    this.clearBetsBtn = this.createButton('CLEAR BETS', 260, 820, () =>
      this.events.emit(UIEventName.CLEAR_BETS)
    );
    this.addChild(this.clearBetsBtn);
  }

  protected createButton(
    label: string,
    x: number,
    y: number,
    onClick: (e: FederatedMouseEvent) => void
  ): Container {
    const container = new Container();

    const button = new Graphics();
    button.roundRect(0, 0, 150, 50, 10);
    button.fill(0x333333);

    const text = new Text({
      text: label,
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0xffffff,
        align: 'center',
      },
    });
    text.anchor.set(0.5);
    text.x = 75;
    text.y = 25;

    container.addChild(button, text);
    container.x = x;
    container.y = y;

    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.on('pointerdown', onClick);

    return container;
  }
}
