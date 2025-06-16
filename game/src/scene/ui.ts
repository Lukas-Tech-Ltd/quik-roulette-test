import gsap, { Expo } from 'gsap';
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
  protected alphaBg: Graphics;
  protected negativeWinDisplay: Container;
  protected positiveWinDisplay: Container;
  protected winAmtText: Text;
  protected formatter: Intl.NumberFormat;

  constructor(opts?: ContainerOptions) {
    super(opts);
    this.events = new EventEmitter();
  }

  public async init(): Promise<void> {
    this.formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    });

    this.startBtn = this.createButton('START', 100, 820, () =>
      this.events.emit(UIEventName.PLACE_BETS)
    );
    this.addChild(this.startBtn);

    this.clearBetsBtn = this.createButton('CLEAR BETS', 260, 820, () =>
      this.events.emit(UIEventName.CLEAR_BETS)
    );
    this.addChild(this.clearBetsBtn);

    this.createBacking();
    this.createNegativeWinDisplay();
    this.createPositiveWinDisplay();
  }

  public async showNegativeWinDisplay(): Promise<void> {
    return new Promise((resolve: () => void) => {
      const tl = gsap.timeline();

      tl.fromTo(
        this.negativeWinDisplay,
        { y: 1000 },
        {
          y: 0,
          duration: 1,
          ease: Expo.easeOut,
          onStart: () => void this.showAlphaBg(true),
        }
      );

      tl.to(this.negativeWinDisplay, {
        y: 1000,
        delay: 2,
        duration: 0.5,
        ease: Expo.easeOut,
        onStart: () => void this.showAlphaBg(false),
        onComplete: () => resolve(),
      });
    });
  }

  public async showPositiveinDisplay(winAmount: number): Promise<void> {
    return new Promise((resolve: () => void) => {
      const tl = gsap.timeline();

      tl.fromTo(
        this.positiveWinDisplay,
        { y: 1000 },
        {
          y: 0,
          duration: 1,
          ease: Expo.easeOut,
          onStart: () => {
            this.winAmtText.text = this.formatter.format(winAmount);
            void this.showAlphaBg(true);
          },
        }
      );

      tl.to(this.positiveWinDisplay, {
        y: 1000,
        delay: 2,
        duration: 0.5,
        ease: Expo.easeOut,
        onStart: () => void this.showAlphaBg(false),
        onComplete: () => resolve(),
      });
    });
  }

  protected async showAlphaBg(show: boolean = true): Promise<void> {
    return new Promise((resolve: () => void) => {
      gsap.fromTo(
        this.alphaBg,
        { alpha: Number(!show) },
        { alpha: Number(show), onComplete: () => resolve() }
      );
    });
  }

  protected createBacking(): void {
    this.alphaBg = new Graphics();
    this.alphaBg.rect(0, 0, 500, 900);
    this.alphaBg.fill({ color: 0x000000, alpha: 0.8 });
    this.addChild(this.alphaBg);
    this.alphaBg.alpha = 0;
  }

  protected createNegativeWinDisplay(): void {
    this.negativeWinDisplay = new Container();

    const winBg = new Graphics();
    winBg.roundRect(125, 250, 250, 100, 10);
    winBg.fill(0x333333);
    this.negativeWinDisplay.addChild(winBg);

    const loseText = new Text({
      text: 'No Win',
      x: 250,
      y: 300,
      anchor: { x: 0.5, y: 0.5 },
      style: {
        fill: 'white',
        fontSize: 28,
        fontFamily: 'Arial',
      },
    });
    this.negativeWinDisplay.addChild(loseText);

    this.addChild(this.negativeWinDisplay);

    this.negativeWinDisplay.y = 1000;
  }

  protected createPositiveWinDisplay(): void {
    this.positiveWinDisplay = new Container();

    const winBg = new Graphics();
    winBg.roundRect(125, 250, 250, 100, 10);
    winBg.fill(0x333333);
    this.positiveWinDisplay.addChild(winBg);

    const winText = new Text({
      text: 'You Win',
      x: 250,
      y: 280,
      anchor: { x: 0.5, y: 0.5 },
      style: {
        fill: 'white',
        fontSize: 28,
        fontFamily: 'Arial',
      },
    });
    this.positiveWinDisplay.addChild(winText);

    this.winAmtText = new Text({
      text: '£0.00',
      x: 250,
      y: 320,
      anchor: { x: 0.5, y: 0.5 },
      style: {
        fill: 'white',
        fontSize: 28,
        fontFamily: 'Arial',
      },
    });
    this.positiveWinDisplay.addChild(this.winAmtText);

    this.addChild(this.positiveWinDisplay);

    this.positiveWinDisplay.y = 1000;
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
