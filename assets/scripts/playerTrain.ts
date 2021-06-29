import { _decorator, Component, Vec2, Vec3, tween, Node, macro, EventKeyboard, SystemEventType, systemEvent, 
    EventMouse, RigidBody2D, Collider2D, BoxCollider2D, Contact2DType, IPhysics2DContact, sp, UITransform, Director, misc, find, Camera, Canvas, Scene, Quat, ConeCollider } from 'cc';
import { CC_Helper } from './common';
import { Maze } from './playerBase'

const { ccclass, property } = _decorator;

@ccclass('PlayerTrain')
export class PlayerTrain extends Maze.PlayerBase 
{
    @property
    rotationSpeed:number = 10;

    onLoad ()
    {
        super.onLoad();
    }

    start () 
    {
        super.start();
    }

    getMovementVec() : Vec3
    {
        var direction:Vec3 = new Vec3(0,0,0);

        var movementVec = new Vec3();

        this.moveDirections.forEach(element => 
        {
            switch(element) 
            {
            case Maze.eMoveDirection.LEFT:
                // do nothing
                break;
            case Maze.eMoveDirection.RIGHT:
                // do nothing
                break;
            case Maze.eMoveDirection.UP:
                var direction:Vec3 = this.direction;
                movementVec.x += direction.x * this.acceleration * this.walkForce;
                movementVec.y += direction.y * this.acceleration * this.walkForce;
                break;
            case Maze.eMoveDirection.DOWN:
                var direction:Vec3 = this.direction;
                movementVec.x -= direction.x * this.acceleration * this.walkForce;
                movementVec.y -= direction.y * this.acceleration * this.walkForce;
                break;
            }
        });

        return movementVec;
    }

    update (deltaTime:number)
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
                    rigidBody.applyForceToCenter( CC_Helper.toVec2(movementVec), true );
                }

                if( rigidBody.linearVelocity.y < this.velocityMax ||
                rigidBody.linearVelocity.y > -this.velocityMax)
                {
                    var movementVec = this.getMovementVec();
                    movementVec.x = 0;
                    movementVec.y *= deltaTime;
                    rigidBody.applyForceToCenter( CC_Helper.toVec2(movementVec), true );
                }
            }
        }

        var rotationAngle:number = 0;

        this.moveDirections.forEach(element => 
        {
            switch(element) 
            {
            case Maze.eMoveDirection.LEFT:
                    rotationAngle += this.rotationSpeed * deltaTime;
                break;
            case Maze.eMoveDirection.RIGHT:
                    rotationAngle -= this.rotationSpeed * deltaTime;
                break;
            case Maze.eMoveDirection.UP:
            case Maze.eMoveDirection.DOWN:
                // do nothing
                break;
            }
        });

        var resultQuat:Quat = new Quat();

        this.node.setRotationFromEuler( 0, 0, this.node.angle + rotationAngle );
    }
}