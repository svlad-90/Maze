import { _decorator, Vec2, Vec3, RigidBody2D, misc, } from 'cc';
import { Maze_Common } from './common';
import { Maze_PlayerBase } from './playerBase'
import { Maze_GlobalMouseListener } from './globalMouseListener'
import { Maze_EasyReference } from './easyReference'

const { ccclass, property } = _decorator;

export namespace Maze_PlayerCursor
{
    @ccclass('PlayerCursor')
    export class PlayerCursor extends Maze_PlayerBase.PlayerBase 
    {
        private easyReference:Maze_EasyReference.EasyReference|null = null;

        public onLoad()
        {
            super.onLoad();

            this.node.addComponent(Maze_EasyReference.EasyReference);
            this.easyReference = this.node.getComponent(Maze_EasyReference.EasyReference);
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
                        movementVec.x -= this.acceleration * this.walkForce;
                    break;
                case Maze_PlayerBase.eMoveDirection.RIGHT:
                        movementVec.x += this.acceleration * this.walkForce;
                    break;
                case Maze_PlayerBase.eMoveDirection.UP:
                        movementVec.y += this.acceleration * this.walkForce;
                    break;
                case Maze_PlayerBase.eMoveDirection.DOWN:
                        movementVec.y -= this.acceleration * this.walkForce;
                    break;
                }
            });

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
        }
    }
}