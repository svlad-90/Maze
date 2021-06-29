import { _decorator, Component, Vec2, Vec3, tween, Node, macro, EventKeyboard, SystemEventType, systemEvent, 
    EventMouse, RigidBody2D, Collider2D, BoxCollider2D, Contact2DType, IPhysics2DContact, sp, UITransform, Director, misc, find, Camera, Canvas, Scene, Quat, ConeCollider } from 'cc';
import { CC_Helper } from './common';

const { ccclass, property } = _decorator;

export namespace Maze
{
    export enum eMoveDirection
    {
        RIGHT = 0,
        LEFT = 1,
        UP = 2,
        DOWN = 3
    };

    @ccclass('PlayerBase')
    export class PlayerBase extends Component 
    {
        @property
        eyesDirection:Vec3 = new Vec3(0,1,0);

        @property
        acceleration:number = 0;
    
        @property
        velocityMax:number = 0;

        private _moveDirections = new Set<eMoveDirection>();
        protected set moveDirections(val:Set<eMoveDirection>)
        { 
            this._moveDirections = val; 
        }
        public get moveDirections() : Set<eMoveDirection>
        {
            return this._moveDirections;
        }

        private _currentMoveDirection:eMoveDirection = eMoveDirection.RIGHT;
        protected set currentMoveDirection(val:eMoveDirection)
        { 
            this._currentMoveDirection = val; 
        }
        public get currentMoveDirection() : eMoveDirection
        {
            return this._currentMoveDirection;
        }

        private _mousePos:Vec3 = new Vec3();
        protected set mousePos(val:Vec3)
        { 
            this._mousePos = val; 
        }
        public get mousePos() : Vec3
        {
            return this._mousePos;
        }

        private _canvas:Canvas|null = null;
        protected set canvas(val:Canvas|null)
        { 
            this._canvas = val; 
        }
        public get canvas() : Canvas|null
        {
            return this._canvas;
        }

        private _camera:Camera|null = null;
        protected set camera(val:Camera|null)
        { 
            this._camera = val; 
        }
        public get camera() : Camera|null
        {
            return this._camera;
        }

        private _walkForce:number = 300;
        protected set walkForce(val:number)
        { 
            this._walkForce = val; 
        }
        public get walkForce() : number
        {
            return this._walkForce;
        }

        onLoad ()
        {
            var scene:Scene|null = Director.instance.getScene();

            if(null != scene)
            {
                var canvasNode = scene.getChildByName("Canvas");

                if(null != canvasNode)
                {
                    this.canvas = canvasNode.getComponent(Canvas);

                    if(null != this.canvas)
                    {
                        this.camera = this.canvas.cameraComponent;
                    }
                }
            }
        }

        start() 
        {
            systemEvent.on(SystemEventType.KEY_DOWN, this.onKeyDown, this);
            systemEvent.on(SystemEventType.KEY_UP, this.onKeyUp, this);
            systemEvent.on(SystemEventType.MOUSE_MOVE, this.onMouseMove, this);

            var spineComp = this.getComponent(sp.Skeleton);
                                
            if(spineComp != null)
            {
                spineComp.setAnimation(0, "idle", true);
            }
        }

        onMouseMove(event: EventMouse)
        {
            var screenLocation = event.getLocation();
            this.mousePos.x = screenLocation.x;
            this.mousePos.y = screenLocation.y;
        }

        onKeyDown (event: EventKeyboard) 
        {
            var applyLogic:boolean = false;
            var identifiedDirection:eMoveDirection = eMoveDirection.DOWN;

            switch(event.keyCode)
            {
                case macro.KEY.a:
                case macro.KEY.left:
                    if(!this.moveDirections.has(eMoveDirection.LEFT))
                    {
                        applyLogic = true;
                        identifiedDirection = eMoveDirection.LEFT;
                    }
                    break;
                case macro.KEY.d:
                case macro.KEY.right:
                    if(!this.moveDirections.has(eMoveDirection.RIGHT))
                    {
                        applyLogic = true;
                        identifiedDirection = eMoveDirection.RIGHT;
                    }
                    break;

                case macro.KEY.w:
                case macro.KEY.up:
                    if(!this.moveDirections.has(eMoveDirection.UP))
                    {
                        applyLogic = true;
                        identifiedDirection = eMoveDirection.UP;
                    }
                    break;
                case macro.KEY.s:
                case macro.KEY.down:
                    if(!this.moveDirections.has(eMoveDirection.DOWN))
                    {
                        applyLogic = true;
                        identifiedDirection = eMoveDirection.DOWN;
                    }
                    break;
            }

            if(true == applyLogic)
            {
                this.moveDirections.add(identifiedDirection);

                var spineComp = this.getComponent(sp.Skeleton);

                if(spineComp != null)
                {
                    spineComp.setAnimation(0, "run", true);
                }

                if(this.currentMoveDirection != identifiedDirection)
                {
                    this.currentMoveDirection = identifiedDirection;
                }
            }
        }

        onKeyUp (event: EventKeyboard) 
        {
            switch(event.keyCode) 
            {
                case macro.KEY.a:
                case macro.KEY.left:
                    this.moveDirections.delete(eMoveDirection.LEFT);
                    break;
                case macro.KEY.d:
                case macro.KEY.right:
                    this.moveDirections.delete(eMoveDirection.RIGHT);
                    break;
                case macro.KEY.w:
                case macro.KEY.up:
                    this.moveDirections.delete(eMoveDirection.UP);
                    break;
                case macro.KEY.s:
                case macro.KEY.down:
                    this.moveDirections.delete(eMoveDirection.DOWN);
                    break;
            }

            if(0 == this.moveDirections.size)
            {
                var spineComp = this.getComponent(sp.Skeleton);

                if(spineComp != null)
                {
                    spineComp.setAnimation(0, "idle", true);
                }
            }
        }

        protected get direction() : Vec3
        {
            var result:Vec3 = new Vec3();
            Vec3.transformQuat(result, this.eyesDirection, this.node.rotation);
            console.log("result - ", result);
            return result;
        }
    }
}