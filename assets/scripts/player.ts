import { _decorator, Component, Vec2, Vec3, tween, Node, macro, EventKeyboard, SystemEventType, systemEvent, 
    EventMouse, RigidBody2D, Collider2D, BoxCollider2D, Contact2DType, IPhysics2DContact } from 'cc';
import { CC_Helper } from './common';

const { ccclass, property } = _decorator;

enum eMoveDirection
{
    RIGHT = 0,
    LEFT = 2
};

@ccclass('Player')
export class Player extends Component {
    
    @property
    jumpImpulse:number = 0;

    @property
    acceleration:number = 0;

    @property
    velocityMaxX:number = 0;

    private walkForce:number = 15000;
    private moveDirections = new Set<eMoveDirection>();
    private onTheGround:boolean = false;

    onLoad ()
    {
    
    }

    start () 
    {
        systemEvent.on(SystemEventType.KEY_DOWN, this.onKeyDown, this);
        systemEvent.on(SystemEventType.KEY_UP, this.onKeyUp, this);

        var colliders = this.getComponents(BoxCollider2D);

        colliders.forEach(element => 
        {
            if(null != element)
            {
                element.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            }
        });   
    }

    onBeginContact (selfCollider:Collider2D, otherCollider:Collider2D, contact:IPhysics2DContact) 
    {
        if(selfCollider.tag == 1)
        {
            this.onTheGround = true;
        }
    }

    onKeyDown (event: EventKeyboard) 
    {
        switch(event.keyCode)
        {
            case macro.KEY.a:
            case macro.KEY.left:
                this.moveDirections.add(eMoveDirection.LEFT);
                break;
            case macro.KEY.d:
            case macro.KEY.right:
                this.moveDirections.add(eMoveDirection.RIGHT);
                break;
            case macro.KEY.space:
                var rigidBody = this.getComponent(RigidBody2D);

                if(rigidBody != null)
                {    
                    if(true == this.onTheGround)
                    {
                        rigidBody.applyForceToCenter( new Vec2(0, this.jumpImpulse * this.walkForce), true );
                        this.onTheGround = false;
                    }
                }

                break;
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
        }
    }
    
    getMovementVec() : Vec3
    {
        var movementVec = new Vec3();

        this.moveDirections.forEach(element => 
        {
            switch(element) 
            {
            case eMoveDirection.LEFT:
                movementVec.x -= this.acceleration * this.walkForce;
                break;
            case eMoveDirection.RIGHT:
                movementVec.x += this.acceleration * this.walkForce;
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
            if( 0 != this.moveDirections.size 
                && ( rigidBody.linearVelocity.x < this.velocityMaxX ||
                rigidBody.linearVelocity.x > -this.velocityMaxX) )
            {
                var movementVec = this.getMovementVec();
                movementVec.x *= deltaTime;
                movementVec.y *= deltaTime;
                rigidBody.applyForceToCenter( CC_Helper.toVec2(movementVec), true );
            }
        }
    }
}