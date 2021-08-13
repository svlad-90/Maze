import { _decorator, Component, Node, Vec2, math, Vec3, Quat } from 'cc';
const { ccclass, property } = _decorator;

import { Maze_DebugGraphics } from '../common/debugGraphics';
import { Maze_MapBuilder } from '../map/mapBuilder';
import { Maze_Common } from '../common';

// let it be the light source, which will provide the visible polygon.
@ccclass('LightingSource')
export class LightingSource extends Component 
{
    map:Maze_MapBuilder.MapBuilder|null = null;

    @property 
    radius:number = 100;

    @property
    updateFrequencyPerSecond = 120;

    private _updateDelay = 0;
    private _currentUpdateDelay = 100000;

    private _debugGraphics:Maze_DebugGraphics.DebugGraphics|null = null;
    private _lightPolygon:Vec2[] = [];
    private _previousPosition:Vec3 = new Vec3();
    private _previousRotation:Quat = new Quat();

    start() 
    {
        this.map = Maze_MapBuilder.MapBuilder.instance;
        this._updateDelay = 1 / this.updateFrequencyPerSecond;
        this._debugGraphics = new Maze_DebugGraphics.DebugGraphics(this.node);
    }

    formVisiblePolygon()
    {
        if(null != this.map && null != this._debugGraphics)
        {
            this._lightPolygon = this.map.formVisiblePolygon(Maze_Common.toVec2(this.node.worldPosition),this.radius);
        }
    }

    drawVisiblePolygon()
    {
        if(null != this._debugGraphics)
        {
            this._debugGraphics.clear();
            this._debugGraphics.circle(this.node.worldPosition.x, this.node.worldPosition.y, this.radius * 2.5);

            if(0 != this._lightPolygon.length)
            {
                this._debugGraphics.strokeColor = new math.Color(255,0,0);
                this._debugGraphics.lineWidth = 20;

                var counter:number = 0;
                for(var point of this._lightPolygon)
                {
                    if(counter == 0)
                    {
                        this._debugGraphics.moveTo(point.x,point.y);
                    }
                    else
                    {
                        this._debugGraphics.lineTo(point.x,point.y);
                    }

                    counter = counter + 1;
                }

                this._debugGraphics.close();
                this._debugGraphics.stroke();
            }
        }
    }

    update(deltaTime:number)
    {
        var shouldDrawPolygon:boolean = false;

        this._currentUpdateDelay = this._currentUpdateDelay + deltaTime;

        if(false == this._previousPosition.equals(this.node.position))
        {
            if(this._currentUpdateDelay > this._updateDelay)
            {
                this._currentUpdateDelay = 0;
                this.formVisiblePolygon();
            }

            shouldDrawPolygon = true;
            this._previousPosition = this.node.position.clone();
        }
        
        if(false == this._previousRotation.equals(this.node.rotation))
        {
            shouldDrawPolygon = true;
            this._previousRotation = this.node.rotation.clone();
        }

        if(true == shouldDrawPolygon)
        {
            this.drawVisiblePolygon();
        }
    }
}