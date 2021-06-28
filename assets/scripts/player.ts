import { _decorator, Component, Vec2, Vec3, tween, Node, macro, EventKeyboard, SystemEventType, systemEvent, 
    EventMouse, RigidBody2D, Collider2D, BoxCollider2D, Contact2DType, IPhysics2DContact, sp, UITransform, Director, misc, find, Camera, Canvas, Scene } from 'cc';
import { CC_Helper } from './common';

const { ccclass, property } = _decorator;

enum eMoveDirection
{
    RIGHT = 0,
    LEFT = 1,
    UP = 2,
    DOWN = 3
};

@ccclass('Player')
export class Player extends Component {

    @property
    acceleration:number = 0;

    @property
    velocityMax:number = 0;

    @property
    eyesDirection:Vec2 = new Vec2(0,1);

    private walkForce:number = 300;
    private moveDirections = new Set<eMoveDirection>();
    private onTheGround:boolean = true;
    private currentMoveDirection:eMoveDirection = eMoveDirection.RIGHT;
    private mousePos:Vec3 = new Vec3();
    private canvas:Canvas|null = null;
    private camera:Camera|null = null;

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

        var UITransformComp = this.node.getComponent(UITransform);
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

        var spineComp = this.getComponent(sp.Skeleton);
                            
        if(spineComp != null)
        {
            spineComp.setAnimation(0, "idle", true);
        }

        systemEvent.on(SystemEventType.MOUSE_MOVE, this.onMouseMove, this);
    }

    onMouseMove(event: EventMouse)
    {
        var screenLocation = event.getLocation();
        this.mousePos.x = screenLocation.x;
        this.mousePos.y = screenLocation.y;
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
            case eMoveDirection.UP:
                movementVec.y += this.acceleration * this.walkForce;
                break;
            case eMoveDirection.DOWN:
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

            var andgleRad:number = this.eyesDirection.signAngle( lookAtVec );
            var angleDeg:number = misc.radiansToDegrees(andgleRad);

            this.node.setRotationFromEuler( 0, 0, angleDeg );
            console.log("mouse pos <x - ", mousePosWorldCoord.x, "y - ", mousePosWorldCoord.y, ">; ", "player pos <x - ", nodeWorldCoord.x, "y - ", nodeWorldCoord.y, ">; ", "angle - ", angleDeg);
        }
    }
}