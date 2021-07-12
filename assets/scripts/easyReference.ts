
import { _decorator, Component, Node, Canvas, Camera, Scene, Director, UITransform } from 'cc';
const { ccclass, property } = _decorator;

export namespace Maze_EasyReference
{
    @ccclass('EasyReference')
    export class EasyReference extends Component 
    {
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

        onLoad()
        {
            var scene:Scene|null = Director.instance.getScene();

            if(null != scene)
            {
                var canvasNode = scene.getChildByName("Canvas");

                if(null != canvasNode)
                {
                    this._canvas = canvasNode.getComponent(Canvas);

                    if(null != this.canvas)
                    {
                        this._camera = this.canvas.cameraComponent;
                    }
                }
            }

            this._UITransform = this.node.getComponent(UITransform);
        }

        start () 
        {
            
        }
    }
}