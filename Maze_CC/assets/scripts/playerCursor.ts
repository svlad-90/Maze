import { _decorator, Vec2, Vec3, RigidBody2D, misc, Event } from 'cc';
import { Maze_Common } from './common';
import { Maze_PlayerBase } from './playerBase'
import { Maze_GlobalMouseListener } from './globalMouseListener'
import { Maze_EasyReference } from './easyReference'
import { Maze_Observer } from './observer/observer';

const { ccclass, property } = _decorator;

export namespace Maze_PlayerCursor
{
    export class CursorPlayerGridPositionContext 
    {
        constructor(playerPosition:Vec2, player:Maze_PlayerCursor.PlayerCursor )
        {
            this.playerPosition = playerPosition;
            this.player = player;
        }
        playerPosition:Vec2; 
        player:Maze_PlayerCursor.PlayerCursor;
    }

    @ccclass('PlayerCursor')
    export class PlayerCursor extends Maze_PlayerBase.PlayerBase 
    {
        private easyReference:Maze_EasyReference.EasyReference|null = null;

        public cursorPlayerGridPositionSubject:Maze_Observer.Subject<CursorPlayerGridPositionContext> = 
        new Maze_Observer.Subject<CursorPlayerGridPositionContext>();

        private _gridPosition:Vec2 = new Vec2(0,0);
        protected set gridPosition(val:Vec2)
        {
            if(false == this._gridPosition.equals(val))
            {
                this._gridPosition = val;
                this.cursorPlayerGridPositionSubject.notify( new CursorPlayerGridPositionContext(this._gridPosition, this) );
            }
        }
        public get gridPosition() : Vec2
        {
            return this._gridPosition;
        }

        public onLoad()
        {
            super.onLoad();
            this.easyReference = new Maze_EasyReference.EasyReference(this.node);
        }

        public start() 
        {
            super.start();
        }

        private getMovementVec() : Vec3
        {
            var direction:Vec3 = new Vec3(0,0,0);

            var movementVec = new Vec3();

            this.moveDirections.forEach(element => 
            {
                switch(element) 
                {
                case Maze_PlayerBase.eMoveDirection.LEFT:
                        movementVec.x -= 1;
                    break;
                case Maze_PlayerBase.eMoveDirection.RIGHT:
                        movementVec.x += 1;
                    break;
                case Maze_PlayerBase.eMoveDirection.UP:
                        movementVec.y += 1;
                    break;
                case Maze_PlayerBase.eMoveDirection.DOWN:
                        movementVec.y -= 1;
                    break;
                }
            });

            movementVec.normalize().multiply( new Vec3(this.acceleration * this.walkForce, this.acceleration * this.walkForce, 0) );

            return movementVec;
        }

        public update (deltaTime:number)
        {
            var rigidBody = this.getComponent(RigidBody2D);

            if(rigidBody != null)
            {
                if( 0 != this.moveDirections.size )
                {
                    if( rigidBody.linearVelocity.x < this.velocityMax ||
                    rigidBody.linearVelocity.x > -this.velocityMax)
                    {
                        var movementVec = this.getMovementVec();
                        movementVec.x *= deltaTime;
                        movementVec.y = 0;
                        rigidBody.applyForceToCenter( Maze_Common.toVec2(movementVec), true );
                    }

                    if( rigidBody.linearVelocity.y < this.velocityMax ||
                    rigidBody.linearVelocity.y > -this.velocityMax)
                    {
                        var movementVec = this.getMovementVec();
                        movementVec.x = 0;
                        movementVec.y *= deltaTime;
                        rigidBody.applyForceToCenter( Maze_Common.toVec2(movementVec), true );
                    }
                }
            }

            if(null != this.easyReference)
            {
                if(null != this.easyReference.camera)
                {
                    var globalMouseListener = this.getComponent(Maze_GlobalMouseListener.GlobalMouseListener);

                    if(null != globalMouseListener)
                    {
                        var mousePosWorldCoord = this.easyReference.camera.screenToWorld( globalMouseListener.mousePos );
                        var nodeWorldCoord = this.node.getWorldPosition();

                        var lookAtVec:Vec2 = new Vec2();

                        lookAtVec.x = mousePosWorldCoord.x - nodeWorldCoord.x;
                        lookAtVec.y = mousePosWorldCoord.y - nodeWorldCoord.y;

                        var eyeDirection2D = new Vec2(this.eyesDirection.x, this.eyesDirection.y);
                        var andgleRad:number = eyeDirection2D.signAngle( lookAtVec );
                        var angleDeg:number = misc.radiansToDegrees(andgleRad);

                        this.node.setRotationFromEuler( 0, 0, angleDeg );

                        //console.log("this.node.rotation - ", this.node.rotation);
                    }
                }
            }

            if(null != this.map)
            {
                var newGridPosition = this.map.pointToTile(Maze_Common.toVec2(this.node.worldPosition));
                this.gridPosition = newGridPosition;
            }
        }
    }
}