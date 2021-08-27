import { _decorator, Component, Node, Vec2, math, Vec3, Quat, Rect, Color } from 'cc';
const { ccclass, property } = _decorator;

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

        private _lightPolygon:[number,number][] = [];
        private _previousPosition:Vec3 = new Vec3();
        private _easyReference:Maze_EasyReference.EasyReference|null = null;
        private _visiblePolygonUpdated:boolean = false;

        getVisiblePolygon():[number,number][]
        {
            return this._lightPolygon;
        }

        hasVisiblePolygonChanged():boolean
        {
            var result = this._visiblePolygonUpdated;
            this._visiblePolygonUpdated = false;
            return result;
        }

        start() 
        {
            this._easyReference = new Maze_EasyReference.EasyReference(this.node);
            this.map = Maze_MapBuilder.MapBuilder.instance;
            this._updateDelay = 1 / this.updateFrequencyPerSecond;
        }

        register()
        {
            // register the light
            if(null != Maze_LightingManager.LightingManager.instance)
            {
                this._visiblePolygonUpdated = true;
                this._lightPolygon = [];

                Maze_LightingManager.LightingManager.instance.registerLightingSource(this);
            }
        }

        unregister() 
        {
            // unregister the light
            if(null != Maze_LightingManager.LightingManager.instance)
            {
                this._visiblePolygonUpdated = true;
                this._lightPolygon = [];

                Maze_LightingManager.LightingManager.instance.unregisterLightingSource(this);
            }        
        }

        formVisiblePolygon()
        {
            if(null != this.map && true == this.map.initialized)
            {
                this._lightPolygon = this.map.formVisiblePolygon(Maze_Common.toVec2(this.node.worldPosition),this.radius);
                this._visiblePolygonUpdated = true;
            }
        }

        worldPosition():Vec2
        {
            return Maze_Common.toVec2(this.node.worldPosition);
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
                this._currentUpdateDelay = this._currentUpdateDelay + deltaTime;

                if(false == this._previousPosition.equals(this.node.position))
                {
                    if(this._currentUpdateDelay > this._updateDelay)
                    {
                        this._currentUpdateDelay = 0;
                        this.formVisiblePolygon();
                    }

                    this._previousPosition = this.node.position.clone();
                }
            }
        }
    }
}