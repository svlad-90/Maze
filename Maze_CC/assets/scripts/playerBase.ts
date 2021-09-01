import { _decorator, Component, Vec3, macro, EventKeyboard, SystemEvent, systemEvent, 
    EventMouse, sp, Director, Camera, Canvas, Scene, Rect, randomRangeInt, Vec2, Collider2D, Contact2DType, IPhysics2DContact, RigidBody2D, KeyCode } from 'cc';
import { Maze_GlobalMouseListener } from './globalMouseListener'
import { Maze_WeaponCursor } from './weaponCursor';
import { Maze_MapBuilder } from './map/mapBuilder'
import { Maze_BulletBase } from './bulletBase';
import { Maze_LightingSource } from './lighting/lightingSource';

const { property } = _decorator;

export namespace Maze_PlayerBase
{
    export enum eMoveDirection
    {
        RIGHT = 0,
        LEFT = 1,
        UP = 2,
        DOWN = 3
    };

    export class PlayerBase extends Component 
    {
        @property
        eyesDirection:Vec3 = new Vec3(0,1,0);

        @property
        acceleration:number = 0;
    
        @property
        velocityMax:number = 0;

        @property (Maze_MapBuilder.MapBuilder)
        map:Maze_MapBuilder.MapBuilder|null = null;

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

        private _walkForce:number = 200000;
        public get walkForce() : number
        {
            return this._walkForce;
        }

        private _lightingSource:Maze_LightingSource.LightingSource|null = null;

        public onLoad ()
        {
        }

        public start() 
        {
            this._lightingSource = this.node.getComponent(Maze_LightingSource.LightingSource);

            if(null != this._lightingSource)
            {
                this._lightingSource.register();
            }

            if(null != this.map)
            {
                var walkableTiles = this.map.filterTiles2( new Rect( 0, 0, this.map.Width, this.map.Height ) );

                var creationTileIndex = randomRangeInt(0, walkableTiles.length);
                var creationTile = walkableTiles[creationTileIndex];

                var creationPos:Vec2 = this.map.tileToPoint(creationTile);
                this.node.setWorldPosition(new Vec3(creationPos.x, creationPos.y, 0));
            }

            var collider2D = this.node.getComponent(Collider2D);
            if(null != collider2D)
            {
                collider2D.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
                collider2D.on(Contact2DType.PRE_SOLVE, this.onPresolve, this);
            }

            this.node.addComponent(Maze_GlobalMouseListener.GlobalMouseListener);

            systemEvent.on(SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
            systemEvent.on(SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
            systemEvent.on(SystemEvent.EventType.MOUSE_DOWN, this.onMouseDown, this);
            systemEvent.on(SystemEvent.EventType.MOUSE_UP, this.onMouseUp, this);

            var spineComp = this.getComponent(sp.Skeleton);
                                
            if(spineComp != null)
            {
                spineComp.setAnimation(0, "idle", true);
            }
        }

        onDestroy()
        {
            if(null != this._lightingSource)
            {
                this._lightingSource.unregister();
            }
        }

        onBeginContact (selfCollider:Collider2D, otherCollider:Collider2D, contact:IPhysics2DContact) 
        {
            if(true == this.node.isValid)
            {
                var bullet = otherCollider.node.getComponent(Maze_BulletBase.BulletBase);

                if(null != bullet)
                { 
                    if(true == bullet.isDamageActive)
                    {
                        bullet.deactivate();
                    }
                }
            }
        }

        onPresolve (selfCollider:Collider2D, otherCollider:Collider2D, contact:IPhysics2DContact) 
        {
            if(true == this.node.isValid)
            {
                var bullet = otherCollider.node.getComponent(Maze_BulletBase.BulletBase);

                if(null != bullet)
                { 
                    if(true == bullet.isDamageActive)
                    {
                        bullet.deactivate();
                    }

                    contact.disabled = true;
                }
            }
        }

        private onMouseDown(event: EventMouse)
        {
            if(event.getButton() == EventMouse.BUTTON_LEFT)
            {
                var weapon = this.getComponent(Maze_WeaponCursor.WeaponCursor);

                if(null != weapon)
                {
                    weapon.fireOn();
                }
            }
        }

        private onMouseUp(event: EventMouse)
        {
            if(event.getButton() == EventMouse.BUTTON_LEFT)
            {
                var weapon = this.getComponent(Maze_WeaponCursor.WeaponCursor);

                if(null != weapon)
                {
                    weapon.fireOff();
                }
            }
        }

        private onKeyDown (event: EventKeyboard) 
        {
            var applyLogic:boolean = false;
            var identifiedDirection:eMoveDirection = eMoveDirection.DOWN;

            switch(event.keyCode)
            {
                case KeyCode.KEY_A:
                case KeyCode.ARROW_LEFT:
                    if(!this.moveDirections.has(eMoveDirection.LEFT))
                    {
                        applyLogic = true;
                        identifiedDirection = eMoveDirection.LEFT;
                    }
                    break;
                case KeyCode.KEY_D:
                case KeyCode.ARROW_RIGHT:
                    if(!this.moveDirections.has(eMoveDirection.RIGHT))
                    {
                        applyLogic = true;
                        identifiedDirection = eMoveDirection.RIGHT;
                    }
                    break;

                case KeyCode.KEY_W:
                case KeyCode.ARROW_UP:
                    if(!this.moveDirections.has(eMoveDirection.UP))
                    {
                        applyLogic = true;
                        identifiedDirection = eMoveDirection.UP;
                    }
                    break;
                case KeyCode.KEY_S:
                case KeyCode.ARROW_DOWN:
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

        private onKeyUp (event: EventKeyboard) 
        {
            switch(event.keyCode) 
            {
                case KeyCode.KEY_A:
                case KeyCode.ARROW_LEFT:
                    this.moveDirections.delete(eMoveDirection.LEFT);
                    break;
                case KeyCode.KEY_D:
                case KeyCode.ARROW_RIGHT:
                    this.moveDirections.delete(eMoveDirection.RIGHT);
                    break;
                case KeyCode.KEY_W:
                case KeyCode.ARROW_UP:
                    this.moveDirections.delete(eMoveDirection.UP);
                    break;
                case KeyCode.KEY_S:
                case KeyCode.ARROW_DOWN:
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
            return result;
        }
    }
}