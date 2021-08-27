
import { _decorator, Component, Node, Graphics, Color, UITransform, Sprite, RenderTexture, Texture2D,
ImageAsset, __private } from 'cc';
import { Maze_CursorDebugPoint } from './cursorDebugPoint'
import { Maze_ILIghtingSource } from './ILightingSource';
import { Maze_EasyReference } from '../easyReference';
import { Maze_DebugGraphics } from '../common/debugGraphics';
const { ccclass, property, executeInEditMode } = _decorator;

export namespace Maze_LightingManager
{
    @ccclass('LightingManager')
    export class LightingManager extends Component
    {
        @property (RenderTexture)
        shadowMap:RenderTexture|null = null;

        @property (Sprite)
        prerenderedScene:Sprite|null = null;

        static instance:LightingManager|null = null;

        @property
        Debug:boolean = false;

        private _cursorDebugPointNode: Node = new Node();
        private _cursorDebugPoint: Maze_CursorDebugPoint.CursorDebugPoint|null = null;
        private _lightingSources: Set<Maze_ILIghtingSource.ILightingSource> = new Set<Maze_ILIghtingSource.ILightingSource>();
        private _easyReference: Maze_EasyReference.EasyReference|null = null;
        private _debugGraphics:Maze_DebugGraphics.DebugGraphics|null = null;

        public registerLightingSource(lightingSource:Maze_ILIghtingSource.ILightingSource)
        {
            if(false == this._lightingSources.has(lightingSource))
            {
                this._lightingSources.add(lightingSource);

                this.updateLightSources();
            }
        }

        public unregisterLightingSource(lightingSource:Maze_ILIghtingSource.ILightingSource)
        {
            if(true == this._lightingSources.has(lightingSource))
            {
                this._lightingSources.delete(lightingSource);

                this.updateLightSources();
            }
        }

        constructor()
        {
            super();
            LightingManager.instance = this;
        }

        onDestroy()
        {
            LightingManager.instance = null;
        }

        start() 
        {
            if(true == this.Debug)
            {
                this._debugGraphics = new Maze_DebugGraphics.DebugGraphics(this.node, 2);
            }

            this._easyReference = new Maze_EasyReference.EasyReference(this.node);

            this.node.insertChild(this._cursorDebugPointNode, this.node.children.length);
            this._cursorDebugPointNode.parent = this.node;

            this._cursorDebugPointNode.addComponent(Maze_CursorDebugPoint.CursorDebugPoint);
            this._cursorDebugPoint = this._cursorDebugPointNode.getComponent(Maze_CursorDebugPoint.CursorDebugPoint);

            if(null != this._cursorDebugPoint)
            {
                this._cursorDebugPoint.active = this.Debug;
            }
        }

        private anyLightingSourceHasChanged()
        {
            var result:boolean = false;

            for(var lightingSource of this._lightingSources)
            {
                if(true == lightingSource.isVisible() && true == lightingSource.hasVisiblePolygonChanged())
                {
                    result = true;
                }
            }

            return result;
        }

        updateLightSources()
        {
            if(true == this.anyLightingSourceHasChanged())
            {
                if(null != this._easyReference && null != this._debugGraphics)
                {
                    this._debugGraphics.clear();
                    this._debugGraphics.clear();
                    this._debugGraphics.clear();

                    var canvasRect = this._easyReference.getScreenWorldCoordRect();
                    canvasRect.x = canvasRect.x - 20;
                    canvasRect.y = canvasRect.y - 20;
                    canvasRect.width = canvasRect.width + 40;
                    canvasRect.height = canvasRect.height + 40;

                    this._debugGraphics.moveTo(canvasRect.x, canvasRect.y);
                    this._debugGraphics.lineTo(canvasRect.x, canvasRect.yMax);
                    this._debugGraphics.lineTo(canvasRect.xMax, canvasRect.yMax);
                    this._debugGraphics.lineTo(canvasRect.xMax, canvasRect.y);
                    this._debugGraphics.lineTo(canvasRect.x, canvasRect.y);

                    this._debugGraphics.close();

                    this._debugGraphics.fillColor = new Color(0,0,0,255);
                    this._debugGraphics.fill();

                    for(var lightingSource of this._lightingSources)
                    {
                        if(true == lightingSource.isVisible())
                        {
                            var visiblePolygon = lightingSource.getVisiblePolygon();

                            var counter = 0;
                            var firstVertex:[number,number]|null = null;

                            if(0 != visiblePolygon.length)
                            {
                                this._debugGraphics.begin_trinagulatedFilledShape(lightingSource.worldPosition(), true);
                            }

                            for(var visibleVertex of visiblePolygon)
                            {
                                if(counter == 0)
                                {
                                    this._debugGraphics.moveTo_trinagulatedFilledShape(visibleVertex[0], visibleVertex[1]);
                                    firstVertex = visibleVertex;
                                }
                                else if(counter == visiblePolygon.length - 1)
                                {
                                    this._debugGraphics.lineTo_trinagulatedFilledShape(visibleVertex[0], visibleVertex[1]);

                                    if(null != firstVertex)
                                    {
                                        this._debugGraphics.lineTo_trinagulatedFilledShape(firstVertex[0], firstVertex[1]);
                                    }
                                }
                                else
                                {
                                    this._debugGraphics.lineTo_trinagulatedFilledShape(visibleVertex[0], visibleVertex[1]);
                                }

                                ++counter;
                            }

                            if(0 != visiblePolygon.length)
                            {
                                this._debugGraphics.end_triangulatedFilledShape(new Color(255,255,255,255));
                            }
                        }
                    }
                }

                var material = this.prerenderedScene?.material;

                if(null != material && null != this.shadowMap)
                {
                    material.setProperty("shadowMap", this.shadowMap.getGFXTexture());
                }
            }
        }

        update()
        {
            this.updateLightSources();
        }
    }
}