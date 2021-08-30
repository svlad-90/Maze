import { _decorator, Canvas, Camera, Node, Scene, Director, UITransform, Vec2, Vec3, Rect } from 'cc';
import { Maze_Common } from './common';

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

        private _finalCamera:Camera|null = null;
        public get finalCamera() : Camera|null
        {
            return this._finalCamera;
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
                        var cameraNode = this._canvas.node.getChildByName("MainCamera");

                        if(null != cameraNode)
                        {
                            this._camera = cameraNode.getComponent(Camera);
                        }

                        var finalCameraNode = this._canvas.node.getChildByName("FinalCamera");

                        if(null != finalCameraNode)
                        {
                            this._finalCamera = finalCameraNode.getComponent(Camera);
                        }
                    }
                }
            }

            this._UITransform = this._node.getComponent(UITransform);
        }

        getScreenWorldCoordRect():Rect
        {
            if(null != this.camera && null != this.canvasUITransform)
            {
                var bottomLeftPoint = Maze_Common.toVec2(this.camera.screenToWorld(new Vec3(0, 0, 0)));
                var topRightPoint = Maze_Common.toVec2(this.camera.screenToWorld(new Vec3(this.canvasUITransform.contentSize.x, this.canvasUITransform.contentSize.y, 0)));
                return new Rect(bottomLeftPoint.x, bottomLeftPoint.y, topRightPoint.x - bottomLeftPoint.x, topRightPoint.y - bottomLeftPoint.y);
            }

            throw("[screenRectWorldCoord] Error! Some of the")
        }
    }
}