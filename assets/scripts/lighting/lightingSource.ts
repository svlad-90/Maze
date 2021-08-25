import { _decorator, Component, Node, Vec2, math, Vec3, Quat, Rect } from 'cc';
const { ccclass, property } = _decorator;

import { Maze_DebugGraphics } from '../common/debugGraphics';
import { Maze_MapBuilder } from '../map/mapBuilder';
import { Maze_Common } from '../common';
import { Maze_EasyReference } from '../easyReference';
import { Maze_ILIghtingSource } from '../lighting/ILightingSource'
import { Maze_LightingManager } from './lightingManager';

export namespace Maze_LightingSource
{
    @ccclass('LightingSource')
    export class LightingSource extends Component implements Maze_ILIghtingSource.ILightingSource
    {
        map:Maze_MapBuilder.MapBuilder|null = null;

        @property 
        radius:number = 100;

        @property
        updateFrequencyPerSecond:number = 120;

        @property
        debug:boolean = false;

        private _updateDelay = 0;
        private _currentUpdateDelay = 100000;

        private _debugGraphics:Maze_DebugGraphics.DebugGraphics|null = null;
        private _lightPolygon:[number,number][] = [];
        private _previousPosition:Vec3 = new Vec3();
        private _previousRotation:Quat = new Quat();
        private _easyReference:Maze_EasyReference.EasyReference|null = null;
        private _visiblePolygonUpdated:boolean = false;

        getVisiblePolygon():[number,number][]
        {
            return this._lightPolygon;
        }

        hasVisiblePolygonChanged():boolean
        {
            return this._visiblePolygonUpdated;
        }

        start() 
        {
            this._easyReference = new Maze_EasyReference.EasyReference(this.node);
            this.map = Maze_MapBuilder.MapBuilder.instance;
            this._updateDelay = 1 / this.updateFrequencyPerSecond;

            if(true == this.debug)
            {
                this._debugGraphics = new Maze_DebugGraphics.DebugGraphics(this.node);
            }

            // register the light
            Maze_LightingManager.LightingManager.instance?.registerLightingSource(this);
        }

    
        onDestroy () 
        {
            // unregister the light
            Maze_LightingManager.LightingManager.instance?.unregisterLightingSource(this);        
        }

        formVisiblePolygon()
        {
            if(null != this.map && true == this.map.initialized)
            {
                this._lightPolygon = this.map.formVisiblePolygon(Maze_Common.toVec2(this.node.worldPosition),this.radius);
                this._visiblePolygonUpdated = true;
            }
        }

        drawVisiblePolygon()
        {
            if(null != this._debugGraphics)
            {
                this._debugGraphics.clear();

                if(0 != this._lightPolygon.length)
                {
                    this._debugGraphics.strokeColor = new math.Color(255,0,0);
                    this._debugGraphics.lineWidth = 20;

                    var counter:number = 0;
                    for(var point of this._lightPolygon)
                    {
                        if(counter == 0)
                        {
                            this._debugGraphics.moveTo(point[0],point[1]);
                        }
                        else
                        {
                            this._debugGraphics.lineTo(point[0],point[1]);
                        }

                        counter = counter + 1;
                    }

                    this._debugGraphics.close();
                    this._debugGraphics.stroke();
                }
            }
        }

        isVisible():boolean
        {
            var result:boolean = false;

            if(null != this._easyReference)
            {
                if(null != this._easyReference.canvasUITransform && null != this._easyReference.camera)
                {
                    var bottomLeftPoint = this._easyReference.camera.screenToWorld(new Vec3(0,0,0));
                    var topRightPoint = this._easyReference.camera.screenToWorld(new Vec3(this._easyReference.canvasUITransform.contentSize.x,
                                                                                        this._easyReference.canvasUITransform.contentSize.y,
                                                                                        0));
                    var sceneRectWorldCoord = new Rect( bottomLeftPoint.x, bottomLeftPoint.y, topRightPoint.x - bottomLeftPoint.x, topRightPoint.y - bottomLeftPoint.y );

                    var lightSourceWorldPos = Maze_Common.toVec2( this.node.worldPosition );

                    if(true == Maze_Common.doesRectangleIntersectsCircle(sceneRectWorldCoord, lightSourceWorldPos, this.radius))
                    {
                        result = true;
                    }
                }
            }

            return result;
        }

        update(deltaTime:number)
        {
            if(true == this.isVisible())
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
            else
            {
                if(true == this.debug && null != this._debugGraphics)
                {
                    this._debugGraphics.clear();
                }
            }
        }
    }
}