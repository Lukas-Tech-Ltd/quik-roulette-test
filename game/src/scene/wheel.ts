import gsap, { Circ, Expo } from 'gsap';
import {
  Container,
  ContainerOptions,
  EventEmitter,
  Graphics,
  Text,
  TextStyle,
  Ticker,
} from 'pixi.js';
import { tableProps } from './table-props';

export class Wheel extends Container {
  public readonly events: EventEmitter<WheelEvent>;
  protected speed: number;

  constructor(opts?: Partial<ContainerOptions>) {
    super(opts);
    this.events = new EventEmitter();
    this.speed = tableProps.wheel.speed.idle;
  }

  public async init(ticker: Ticker): Promise<void> {
    this.createWheel();

    ticker.add((ticker: Ticker) => this.onUpdate(ticker));
  }

  public spin(): Promise<void> {
    return new Promise((resolve: () => void) => {
      const timeline = gsap.timeline();

      timeline.to(this, {
        speed: tableProps.wheel.speed.spinning,
        duration: tableProps.wheel.duration.start,
        ease: Expo.easeIn,
      });

      timeline.to({}, { duration: tableProps.wheel.duration.wait });

      timeline.to(this, {
        speed: tableProps.wheel.speed.idle,
        duration: tableProps.wheel.duration.stop,
        ease: Circ.easeOut,
        onComplete: () => resolve(),
      });
    });
  }

  protected setSpeed(speed: number): void {
    this.speed = speed;
  }

  protected onUpdate(ticker: Ticker): void {
    this.rotation += this.speed * (ticker.deltaMS / 1000);
  }

  protected createWheel(): void {
    const sequence = [
      0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
      24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
    ];

    const innerRadius = tableProps.wheel.radius * 0.8;
    const landingInnerRadius = tableProps.wheel.radius * 0.6;
    const landingOuterRadius = innerRadius;

    const runnerOuter = tableProps.wheel.radius + 14;
    const runnerInner = tableProps.wheel.radius + 2;

    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 'white',
      align: 'center',
    });

    const sliceAngle = (Math.PI * 2) / sequence.length;

    const runner = new Graphics();
    runner.circle(0, 0, runnerOuter);
    runner.circle(0, 0, runnerInner);
    runner.fill(0x222222);
    this.addChild(runner);

    for (let i = 0; i < sequence.length; i++) {
      const num = sequence[i];
      const angleStart = i * sliceAngle - Math.PI / 2;
      const angleEnd = angleStart + sliceAngle;

      let lightColor = tableProps.colors.green[0];
      let darkColor = tableProps.colors.green[1];
      if (tableProps.redNumbers.includes(num)) {
        lightColor = tableProps.colors.red[0];
        darkColor = tableProps.colors.red[1];
      } else if (tableProps.blackNumbers.includes(num)) {
        lightColor = tableProps.colors.black[0];
        darkColor = tableProps.colors.black[1];
      }

      const landing = new Graphics();
      landing.moveTo(
        0 + landingInnerRadius * Math.cos(angleStart),
        0 + landingInnerRadius * Math.sin(angleStart)
      );
      landing.arc(0, 0, landingOuterRadius, angleStart, angleEnd);
      landing.lineTo(
        0 + landingInnerRadius * Math.cos(angleEnd),
        0 + landingInnerRadius * Math.sin(angleEnd)
      );
      landing.arc(0, 0, landingInnerRadius, angleEnd, angleStart, true);
      landing.fill(darkColor);
      landing.stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
      this.addChild(landing);

      const segment = new Graphics();
      segment.moveTo(
        0 + innerRadius * Math.cos(angleStart),
        0 + innerRadius * Math.sin(angleStart)
      );
      segment.arc(0, 0, tableProps.wheel.radius, angleStart, angleEnd);
      segment.lineTo(
        0 + innerRadius * Math.cos(angleEnd),
        0 + innerRadius * Math.sin(angleEnd)
      );
      segment.arc(0, 0, innerRadius, angleEnd, angleStart, true);
      segment.fill(lightColor);
      segment.stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
      this.addChild(segment);

      const label = new Text({ text: num.toString(), style: textStyle });
      label.anchor.set(0.5);
      const midAngle = angleStart + sliceAngle / 2;
      const labelRadius = (tableProps.wheel.radius + innerRadius) / 2;
      label.x = 0 + labelRadius * Math.cos(midAngle);
      label.y = 0 + labelRadius * Math.sin(midAngle);
      label.rotation = midAngle + Math.PI / 2;
      this.addChild(label);
    }

    this.position.set(tableProps.wheel.x, tableProps.wheel.y);
  }
}
