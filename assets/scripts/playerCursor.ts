import { _decorator, Component, Vec2, Vec3, tween, Node, macro, EventKeyboard, SystemEventType, systemEvent, 
    EventMouse, RigidBody2D, Collider2D, BoxCollider2D, Contact2DType, IPhysics2DContact, sp, UITransform, Director, misc, find, Camera, Canvas, Scene, Quat, ConeCollider } from 'cc';
import { CC_Helper } from './common';
import { Maze } from './playerBase'

const { ccclass, property } = _decorator;

@ccclass('PlayerCursor')
export class PlayerCursor extends Maze.PlayerBase {

    onLoad()
    {
        super.onLoad();
    }

    start() 
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
                    movementVec.x -= this.acceleration * this.walkForce;
                break;
            case Maze.eMoveDirection.RIGHT:
                    movementVec.x += this.acceleration * this.walkForce;
                break;
            case Maze.eMoveDirection.UP:
                    movementVec.y += this.acceleration * this.walkForce;
                break;
            case Maze.eMoveDirection.DOWN:
                    movementVec.y -= this.acceleration * this.walkForce;
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

        if(null != this.camera)
        {
            var mousePosWorldCoord = this.camera.screenToWorld( this.mousePos );
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