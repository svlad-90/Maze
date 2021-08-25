
import { _decorator, Component, Node, Graphics, Color, UITransform } from 'cc';
import { Maze_CursorDebugPoint } from './cursorDebugPoint'
import { Maze_ILIghtingSource } from './ILightingSource';
import { Maze_EasyReference } from '../easyReference';
const { ccclass, property, executeInEditMode } = _decorator;

export namespace Maze_LightingManager
{
    @ccclass('LightingManager')
    export class LightingManager extends Component
    {
        static instance:LightingManager|null = null;

        @property
        Debug:boolean = false;

        private _cursorDebugPointNode: Node = new Node();
        private _cursorDebugPoint: Maze_CursorDebugPoint.CursorDebugPoint|null = null;
        private _lightingSources: Set<Maze_ILIghtingSource.ILightingSource> = new Set<Maze_ILIghtingSource.ILightingSource>();
        private _easyReference: Maze_EasyReference.EasyReference|null = null;

        public registerLightingSource(lightingSource:Maze_ILIghtingSource.ILightingSource)
        {
            if(false == this._lightingSources.has(lightingSource))
            {
                this._lightingSources.add(lightingSource);
            }
        }

        public unregisterLightingSource(lightingSource:Maze_ILIghtingSource.ILightingSource)
        {
            if(true == this._lightingSources.has(lightingSource))
            {
                this._lightingSources.delete(lightingSource);
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
            this._easyReference = new Maze_EasyReference.EasyReference(this.node);

            if(null != this._easyReference.camera && null != this._easyReference.canvasUITransform)
            {

            }

            this.node.insertChild(this._cursorDebugPointNode, this.node.children.length);
            this._cursorDebugPointNode.parent = this.node;

            this._cursorDebugPointNode.addComponent(Maze_CursorDebugPoint.CursorDebugPoint);
            this._cursorDebugPoint = this._cursorDebugPointNode.getComponent(Maze_CursorDebugPoint.CursorDebugPoint);

            if(null != this._cursorDebugPoint)
            {
                this._cursorDebugPoint.active = this.Debug;
            }
        }

        update()
        {
            
        }
    }
}