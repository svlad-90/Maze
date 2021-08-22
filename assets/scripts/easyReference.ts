
import { _decorator, Canvas, Camera, Node, Scene, Director, UITransform } from 'cc';

export namespace Maze_EasyReference
{
    export class EasyReference
    {
        private _node:Node;

        private _canvas:Canvas|null = null;
        public get canvas() : Canvas|null
        {
            return this._canvas;
        }

        private _camera:Camera|null = null;
        public get camera() : Camera|null
        {
            return this._camera;
        }
        
        private _UITransform:UITransform|null = null;
        public get UITransform() : UITransform|null
        {
            return this._UITransform;
        }

        private _canvasUITransform:UITransform|null = null;
        public get canvasUITransform() : UITransform|null
        {
            return this._canvasUITransform;
        }

        constructor(node:Node)
        {
            this._node = node;

            var scene:Scene|null = Director.instance.getScene();

            if(null != scene)
            {
                var canvasNode = scene.getChildByName("Canvas");

                if(null != canvasNode)
                {
                    this._canvas = canvasNode.getComponent(Canvas);
                    this._canvasUITransform = canvasNode.getComponent(UITransform);

                    if(null != this._canvas)
                    {
                        this._camera = this._canvas.cameraComponent;
                    }
                }
            }

            this._UITransform = this._node.getComponent(UITransform);
        }
    }
}