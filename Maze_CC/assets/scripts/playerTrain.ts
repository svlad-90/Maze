import { _decorator, Vec3, RigidBody2D, Quat } from 'cc';
import { Maze_Common } from './common';
import { Maze_PlayerBase } from './playerBase'

export namespace Maze_PlayerTrain
{
    const { ccclass, property } = _decorator;

    @ccclass('PlayerTrain')
    export class PlayerTrain extends Maze_PlayerBase.PlayerBase 
    {
        @property
        rotationSpeed:number = 10;

        public onLoad ()
        {
            super.onLoad();
        }

        public start () 
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
                    // do nothing
                    break;
                case Maze_PlayerBase.eMoveDirection.RIGHT:
                    // do nothing
                    break;
                case Maze_PlayerBase.eMoveDirection.UP:
                    var direction:Vec3 = this.direction;
                    movementVec.x += direction.x * this.acceleration * this.walkForce;
                    movementVec.y += direction.y * this.acceleration * this.walkForce;
                    break;
                case Maze_PlayerBase.eMoveDirection.DOWN:
                    var direction:Vec3 = this.direction;
                    movementVec.x -= direction.x * this.acceleration * this.walkForce;
                    movementVec.y -= direction.y * this.acceleration * this.walkForce;
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

            var rotationAngle:number = 0;

            this.moveDirections.forEach(element => 
            {
                switch(element) 
                {
                case Maze_PlayerBase.eMoveDirection.LEFT:
                        rotationAngle += this.rotationSpeed * deltaTime;
                    break;
                case Maze_PlayerBase.eMoveDirection.RIGHT:
                        rotationAngle -= this.rotationSpeed * deltaTime;
                    break;
                case Maze_PlayerBase.eMoveDirection.UP:
                case Maze_PlayerBase.eMoveDirection.DOWN:
                    // do nothing
                    break;
                }
            });

            this.node.setRotationFromEuler( 0, 0, this.node.angle + rotationAngle );
        }
    }
}