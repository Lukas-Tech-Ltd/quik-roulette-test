import gsap, { Expo, Power1 } from 'gsap';
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
  protected ballSpeed: number;
  protected ball: Container;
  protected ballGfx: Graphics;

  constructor(opts?: Partial<ContainerOptions>) {
    super(opts);
    this.events = new EventEmitter();
    this.speed = tableProps.wheel.speed.idle;
    this.ballSpeed = 0;
  }

  public async init(ticker: Ticker): Promise<void> {
    this.createWheel();
    this.createBall();

    ticker.add((ticker: Ticker) => this.onUpdate(ticker));
  }

  public spin(): Promise<void> {
    return new Promise((resolve: () => void) => {
      this.ball.visible = false;
      this.ball.rotation = 0;
      this.ballGfx.y = 0;

      gsap.to(this, {
        speed: tableProps.wheel.speed.spinning,
        duration: tableProps.wheel.duration.start,
        ease: Expo.easeIn,
        onComplete: () => resolve(),
      });

      gsap.to(this, {
        delay: 3,
        ballSpeed: tableProps.wheel.ball.speed,
        duration: 0.1,
        onStart: () => {
          this.ball.visible = true;
        },
      });
    });
  }

  public stop(result: number): Promise<void> {
    return new Promise((resolve: () => void) => {
      const angle = this.getBallAngleForResult(result);

      gsap.to(this, {
        speed: tableProps.wheel.speed.idle,
        duration: tableProps.wheel.duration.stop,
        ease: Power1.easeOut,
        onComplete: () => resolve(),
      });

      gsap.to(this.ball, {
        rotation: Math.PI * 4 + angle,
        delay: tableProps.wheel.duration.stop * 0.6,
        duration: 1.5,
        onStart: () => {
          this.ballSpeed = 0;
          this.dropBall();
        },
      });
    });
  }

  protected onUpdate(ticker: Ticker): void {
    this.rotation -= this.speed * (ticker.deltaMS / 1000);
    this.ball.rotation += this.ballSpeed * (ticker.deltaMS / 1000);
    if (this.ball.rotation >= Math.PI * 2) {
      this.ball.rotation -= Math.PI * 2;
    }
  }

  protected getBallAngleForResult(result: number): number {
    const index = tableProps.wheel.numberSequence.indexOf(result);
    if (index === 0) {
      return 0;
    }

    const sliceAngle = (Math.PI * 2) / tableProps.wheel.numberSequence.length;
    const angle = sliceAngle * index + sliceAngle / 2;

    return angle;
  }

  protected dropBall(): Promise<void> {
    return new Promise((resolve: () => void) => {
      const tl = gsap.timeline({
        onComplete: () => resolve(),
      });

      this.ballGfx.y = tableProps.wheel.ball.startY;
      const bounces = 8;
      const totalDuration = 1.5;
      const intensityY = 20;
      const intensityX = 90;

      let currentY = 0;
      let currentX = 0;
      for (let i = 0; i < bounces; i++) {
        const bounceHeight = intensityY * Math.pow(0.6, i);
        const lateralOffset =
          intensityX * Math.pow(0.6, i) * (i % 2 === 0 ? 1 : -1);
        const duration = totalDuration / (bounces + i);

        const targetY =
          currentY + (tableProps.wheel.ball.endY - currentY) / (bounces - i);
        const targetX = currentX + -currentX / (bounces - i) + lateralOffset;

        tl.to(this.ballGfx, {
          y: targetY,
          x: targetX,
          duration: duration / 2,
          ease: 'expo.in',
        });

        tl.to(this.ballGfx, {
          y: targetY - bounceHeight,
          x: targetX - lateralOffset * 0.5,
          duration: duration / 2,
          ease: 'expo.out',
        });

        currentY = targetY;
        currentX = targetX - lateralOffset * 0.5;
      }

      tl.to(this.ballGfx, {
        x: 0,
        y: tableProps.wheel.ball.endY,
        duration: 0.2,
        ease: 'power1.out',
      });
    });
  }

  protected createWheel(): void {
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

    const sliceAngle = (Math.PI * 2) / tableProps.wheel.numberSequence.length;

    const runner = new Graphics();
    runner.circle(0, 0, runnerOuter);
    runner.circle(0, 0, runnerInner);
    runner.fill(0x222222);
    this.addChild(runner);

    for (let i = 0; i < tableProps.wheel.numberSequence.length; i++) {
      const num = tableProps.wheel.numberSequence[i];
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
        landingInnerRadius * Math.cos(angleStart),
        landingInnerRadius * Math.sin(angleStart)
      );
      landing.arc(0, 0, landingOuterRadius, angleStart, angleEnd);
      landing.lineTo(
        landingInnerRadius * Math.cos(angleEnd),
        landingInnerRadius * Math.sin(angleEnd)
      );
      landing.arc(0, 0, landingInnerRadius, angleEnd, angleStart, true);
      landing.fill(darkColor);
      landing.stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
      this.addChild(landing);

      const segment = new Graphics();
      segment.moveTo(
        innerRadius * Math.cos(angleStart),
        innerRadius * Math.sin(angleStart)
      );
      segment.arc(0, 0, tableProps.wheel.radius, angleStart, angleEnd);
      segment.lineTo(
        innerRadius * Math.cos(angleEnd),
        innerRadius * Math.sin(angleEnd)
      );
      segment.arc(0, 0, innerRadius, angleEnd, angleStart, true);
      segment.fill(lightColor);
      segment.stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
      this.addChild(segment);

      const label = new Text({ text: num.toString(), style: textStyle });
      label.anchor.set(0.5);
      const midAngle = angleStart + sliceAngle / 2;
      const labelRadius = (tableProps.wheel.radius + innerRadius) / 2;
      label.x = labelRadius * Math.cos(midAngle);
      label.y = labelRadius * Math.sin(midAngle);
      label.rotation = midAngle + Math.PI / 2;
      this.addChild(label);
    }

    this.position.set(tableProps.wheel.x, tableProps.wheel.y);
  }

  protected createBall(): void {
    this.ball = new Container();

    this.ballGfx = new Graphics();
    this.ballGfx.circle(0, -228, 8);
    this.ballGfx.fill(0xffffff);
    this.ball.addChild(this.ballGfx);

    this.ball.visible = false;
    this.ball.rotation = 0;
    this.ballGfx.y = 0;

    this.addChild(this.ball);
  }
}
