
import { _decorator, Component, Node, Graphics, math, UITransform, Vec3 } from 'cc';

export namespace Maze_DebugGraphics
{
    export class DebugGraphics
    {
        private _graphicsNode:Node = new Node();
        private _graphics:Graphics;
        private _uiTransform:UITransform;

        constructor(parent:Node|null)
        {
            this.parent = parent;

            this._graphicsNode.addComponent(Graphics);

            var graphics = this._graphicsNode.getComponent(Graphics);

            if(null != graphics)
            {
                this._graphics = graphics
            }
            else
            {
                throw("Error! Was not able to assign Graphics component!");
            }

            var uiTransform = this._graphicsNode.getComponent(UITransform);

            if(null != uiTransform)
            {
                this._uiTransform = uiTransform
            }
            else
            {
                throw("Error! Was not able to assign UITransform component!");
            }
        }

        set parent(val:Node|null)
        {
            if(null != this._graphicsNode.parent)
            {
                this._graphicsNode.parent.removeChild(this._graphicsNode);
            }

            this._graphicsNode.parent = val;

            if(null != val)
            {
                val.addChild(this._graphicsNode);
            }
        }
        get parent():Node|null
        {
            return this._graphicsNode.parent;
        }

        get lineWidth(): number
        {
            return this._graphics.lineWidth;
        }

        set lineWidth(value: number)
        {
            this._graphics.lineWidth = value;
        }
        
        get strokeColor(): Readonly<math.Color>
        {
            return this._graphics.strokeColor;
        }

        set strokeColor(value: Readonly<math.Color>)
        {
            this._graphics.strokeColor = value;
        }

        get fillColor(): Readonly<math.Color>
        {
            return this._graphics.fillColor;
        }

        set fillColor(value: Readonly<math.Color>)
        {
            this._graphics.fillColor = value;
        }

        get miterLimit(): number
        {
            return this._graphics.miterLimit;
        }

        set miterLimit(value: number)
        {
            this._graphics.miterLimit = value;
        }

        get color(): math.Color
        {
            return this._graphics.color;
        }

        set color(value: math.Color)
        {
            this._graphics.color = value;
        }

        get srcBlendFactor(): import("cocos/core/gfx").BlendFactor
        {
            return this._graphics.srcBlendFactor;
        }

        set srcBlendFactor(value: import("cocos/core/gfx").BlendFactor)
        {
            this._graphics.srcBlendFactor = value;
        }

        get dstBlendFactor(): import("cocos/core/gfx").BlendFactor
        {
            return this._graphics.dstBlendFactor;
        }

        set dstBlendFactor(value: import("cocos/core/gfx").BlendFactor)
        {
            this._graphics.dstBlendFactor = value;
        }

        onRestore(): void
        {
            this._graphics.onRestore();
        }

        onLoad(): void
        {
            this._graphics.onLoad();
        }

        onEnable(): void
        {
            this._graphics.onEnable();
        }

        onDisable(): void
        {
            this._graphics.onDisable();
        }

        onDestroy(): void
        {
            this._graphics.onDestroy();
        }

        moveTo(x: number, y: number): void
        {
            var localPosition = this._uiTransform.convertToNodeSpaceAR(new Vec3(x,y,0));
            this._graphics.moveTo(localPosition.x, localPosition.y);
        }

        lineTo(x: number, y: number): void
        {
            var localPosition = this._uiTransform.convertToNodeSpaceAR(new Vec3(x,y,0));
            this._graphics.lineTo(localPosition.x, localPosition.y);
        }

        bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void
        {
            var localPosition1 = this._uiTransform.convertToNodeSpaceAR(new Vec3(c1x,c1y,0));
            var localPosition2 = this._uiTransform.convertToNodeSpaceAR(new Vec3(c2x,c2y,0));
            var localPosition3 = this._uiTransform.convertToNodeSpaceAR(new Vec3(x,y,0));
            this._graphics.bezierCurveTo(localPosition1.x, localPosition1.y, localPosition2.x, localPosition2.y, localPosition3.x, localPosition3.y);
        }

        quadraticCurveTo(cx: number, cy: number, x: number, y: number): void
        {
            var localPosition1 = this._uiTransform.convertToNodeSpaceAR(new Vec3(cx,cy,0));
            var localPosition2 = this._uiTransform.convertToNodeSpaceAR(new Vec3(x,y,0));
            this._graphics.quadraticCurveTo(localPosition1.x, localPosition1.y, localPosition2.x, localPosition2.y);
        }

        arc(cx: number, cy: number, r: number, startAngle: number, endAngle: number, counterclockwise: boolean): void
        {
            var localPosition = this._uiTransform.convertToNodeSpaceAR(new Vec3(cx,cy,0));
            this._graphics.arc(localPosition.x, localPosition.y, r, startAngle, endAngle, counterclockwise);
        }

        ellipse(cx: number, cy: number, rx: number, ry: number): void
        {
            var localPosition = this._uiTransform.convertToNodeSpaceAR(new Vec3(cx,cy,0));
            this._graphics.ellipse(localPosition.x, localPosition.y, rx, ry);
        }

        circle(cx: number, cy: number, r: number): void
        {
            var localPosition = this._uiTransform.convertToNodeSpaceAR(new Vec3(cx,cy,0));
            this._graphics.circle(localPosition.x, localPosition.y, r * this._graphicsNode.scale.x);
        }

        rect(x: number, y: number, w: number, h: number): void
        {
            var localPosition = this._uiTransform.convertToNodeSpaceAR(new Vec3(x,y,0));
            this._graphics.rect(localPosition.x, localPosition.y, w, h);
        }

        roundRect(x: number, y: number, w: number, h: number, r: number): void
        {
            var localPosition = this._uiTransform.convertToNodeSpaceAR(new Vec3(x,y,0));
            this._graphics.roundRect(localPosition.x, localPosition.y, w, h, r);
        }

        fillRect(x: any, y: any, w: any, h: any): void
        {
            var localPosition = this._uiTransform.convertToNodeSpaceAR(new Vec3(x,y,0));
            this._graphics.fillRect(localPosition.x, localPosition.y, w, h);
        }

        clear(): void
        {
            this._graphics.clear();
        }

        close(): void
        {
            this._graphics.close();
        }

        stroke(): void
        {
            this._graphics.stroke();
        }

        fill(): void
        {
            this._graphics.fill();
        }

        activeSubModel(idx: number): void
        {
            this._graphics.activeSubModel(idx);
        }
    }
}