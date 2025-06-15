import {
  Container,
  ContainerOptions,
  Graphics,
  Text,
  TextStyle,
} from 'pixi.js';
import { tableProps } from './table-props';

export class Wheel extends Container {
  constructor(opts?: ContainerOptions) {
    super(opts);
  }

  public async init(): Promise<void> {
    this.createWheel();
  }

  public createWheel(): void {
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
    runner.circle(tableProps.wheel.x, tableProps.wheel.y, runnerOuter);
    runner.circle(tableProps.wheel.x, tableProps.wheel.y, runnerInner);
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
        tableProps.wheel.x + landingInnerRadius * Math.cos(angleStart),
        tableProps.wheel.y + landingInnerRadius * Math.sin(angleStart)
      );
      landing.arc(
        tableProps.wheel.x,
        tableProps.wheel.y,
        landingOuterRadius,
        angleStart,
        angleEnd
      );
      landing.lineTo(
        tableProps.wheel.x + landingInnerRadius * Math.cos(angleEnd),
        tableProps.wheel.y + landingInnerRadius * Math.sin(angleEnd)
      );
      landing.arc(
        tableProps.wheel.x,
        tableProps.wheel.y,
        landingInnerRadius,
        angleEnd,
        angleStart,
        true
      );
      landing.fill(darkColor);
      landing.stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
      this.addChild(landing);

      const segment = new Graphics();
      segment.moveTo(
        tableProps.wheel.x + innerRadius * Math.cos(angleStart),
        tableProps.wheel.y + innerRadius * Math.sin(angleStart)
      );
      segment.arc(
        tableProps.wheel.x,
        tableProps.wheel.y,
        tableProps.wheel.radius,
        angleStart,
        angleEnd
      );
      segment.lineTo(
        tableProps.wheel.x + innerRadius * Math.cos(angleEnd),
        tableProps.wheel.y + innerRadius * Math.sin(angleEnd)
      );
      segment.arc(
        tableProps.wheel.x,
        tableProps.wheel.y,
        innerRadius,
        angleEnd,
        angleStart,
        true
      );
      segment.fill(lightColor);
      segment.stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
      this.addChild(segment);

      const label = new Text({ text: num.toString(), style: textStyle });
      label.anchor.set(0.5);
      const midAngle = angleStart + sliceAngle / 2;
      const labelRadius = (tableProps.wheel.radius + innerRadius) / 2;
      label.x = tableProps.wheel.x + labelRadius * Math.cos(midAngle);
      label.y = tableProps.wheel.y + labelRadius * Math.sin(midAngle);
      label.rotation = midAngle + Math.PI / 2;
      this.addChild(label);
    }
  }
}
