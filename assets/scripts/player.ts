import { _decorator, Component, Vec2, Vec3, tween, Node, macro, EventKeyboard, SystemEventType, systemEvent, 
    EventMouse, RigidBody2D, Collider2D, BoxCollider2D, Contact2DType, IPhysics2DContact, sp } from 'cc';
import { CC_Helper } from './common';
import { TrackEntry } from "./spine/spine-core"

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

    private walkForce:number = 1000;
    private moveDirections = new Set<eMoveDirection>();
    private onTheGround:boolean = true;
    private currentMoveDirection:eMoveDirection = eMoveDirection.RIGHT;
    private jumpInProgress:boolean = false;

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

                if(!this.moveDirections.has(eMoveDirection.LEFT))
                {
                    this.moveDirections.add(eMoveDirection.LEFT);

                    var spineComp = this.getComponent(sp.Skeleton);

                    if(spineComp != null && this.jumpInProgress == false)
                    {
                        spineComp.setAnimation(0, "run", true);
                    }

                    if(this.currentMoveDirection != eMoveDirection.LEFT)
                    {
                        this.node.setScale(-this.node.scale.x, this.node.scale.y, this.node.scale.z);
                        this.currentMoveDirection = eMoveDirection.LEFT;
                    }
                }

                break;
            case macro.KEY.d:
            case macro.KEY.right:

                if(!this.moveDirections.has(eMoveDirection.RIGHT))
                {
                    this.moveDirections.add(eMoveDirection.RIGHT);

                    var spineComp = this.getComponent(sp.Skeleton);

                    if(spineComp != null && this.jumpInProgress == false)
                    {
                        spineComp.setAnimation(0, "run", true);
                    }

                    if(this.currentMoveDirection != eMoveDirection.RIGHT)
                    {
                        this.node.setScale(-this.node.scale.x, this.node.scale.y, this.node.scale.z);
                        this.currentMoveDirection = eMoveDirection.RIGHT;
                    }
                }

                break;
            case macro.KEY.space:
                var rigidBody = this.getComponent(RigidBody2D);

                if(rigidBody != null)
                {    
                    if(true == this.onTheGround)
                    {
                        this.jumpInProgress = true;

                        rigidBody.applyForceToCenter( new Vec2(0, this.jumpImpulse * this.walkForce), true );
                        //this.onTheGround = false;

                        var spineComp = this.getComponent(sp.Skeleton);

                        if(spineComp != null)
                        {
                            spineComp.setAnimation(0, "jump", false);

                            let onAnimationComplete = (x: spine.TrackEntry): void => 
                            {
                                if(x.animation.name == "jump")
                                {
                                    this.jumpInProgress = false;

                                    var spineComp = this.getComponent(sp.Skeleton);
                            
                                    if(spineComp != null)
                                    {
                                        spineComp.setAnimation(0, "idle", true);
                                    }
                                }
                            };

                            spineComp.setCompleteListener(onAnimationComplete);
                        }
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

        if(0 == this.moveDirections.size && false == this.jumpInProgress)
        {
            var spineComp = this.getComponent(sp.Skeleton);

            if(spineComp != null)
            {
                spineComp.setAnimation(0, "idle", true);
            }
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