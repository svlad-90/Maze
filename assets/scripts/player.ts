import { _decorator, Component, Vec2, Vec3, tween, Node, macro, EventKeyboard, SystemEventType, systemEvent, EventMouse } from 'cc';

const { ccclass, property } = _decorator;

enum eMoveDirection
{
    UP = 0,
    RIGHT = 1,
    DOWN = 2,
    LEFT = 3,
};

@ccclass('Player')
export class Player extends Component {
    
    @property
    jumpHeight:number = 0;

    @property
    jumpDuration:number = 0;

    @property
    maxMovementSpeed:number = 0;

    @property
    acceleration:number = 0;

    private moveDirections : Set<eMoveDirection> = new Set<eMoveDirection>();

    onLoad ()
    {

    }

    start () 
    {
        systemEvent.on(SystemEventType.KEY_DOWN, this.onKeyDown, this);
        systemEvent.on(SystemEventType.KEY_UP, this.onKeyUp, this);
        systemEvent.on(SystemEventType.MOUSE_DOWN, this.onMouseDown, this);
    }

    onMouseDown(event: EventMouse)
    {
        switch(event.getButton())
        {
            case EventMouse.BUTTON_LEFT:
                tween(this.node)
                .to(this.jumpDuration, { position : new Vec3(this.node.position.x, this.node.position.y + this.jumpHeight, this.node.position.z) })
                .to(this.jumpDuration, { position : new Vec3(this.node.position.x, this.node.position.y, this.node.position.z) })
                .union()
                .start();
                break;
        }
    }

    onKeyDown (event: EventKeyboard) 
    {
        switch(event.keyCode)
        {
            case macro.KEY.a:
                console.log("a->down");
                this.moveDirections.add(eMoveDirection.LEFT);
                break;
            case macro.KEY.s:
                console.log("s->down");
                this.moveDirections.add(eMoveDirection.DOWN);
                break;
            case macro.KEY.d:
                console.log("d->down");
                this.moveDirections.add(eMoveDirection.RIGHT);
                break;
            case macro.KEY.w:
                console.log("w->down");
                this.moveDirections.add(eMoveDirection.UP);
                break;
        }
    }

    onKeyUp (event: EventKeyboard) 
    {
        switch(event.keyCode) 
        {
            case macro.KEY.a:
                console.log("a->up");
                this.moveDirections.delete(eMoveDirection.LEFT);
                break;
            case macro.KEY.s:
                console.log("s->up");
                this.moveDirections.delete(eMoveDirection.DOWN);
                break;
            case macro.KEY.d:
                console.log("d->up");
                this.moveDirections.delete(eMoveDirection.RIGHT);
                break;
            case macro.KEY.w:
                console.log("w->up");
                this.moveDirections.delete(eMoveDirection.UP);
                break;
        }
    }
    
    update (deltaTime:number)
    {
        var movementVec = new Vec3();

        this.moveDirections.forEach(element => 
        {
            switch(element) 
            {
            case eMoveDirection.LEFT:
                movementVec.x -= this.acceleration * deltaTime;
                break;
            case eMoveDirection.DOWN:
                movementVec.y -= this.acceleration * deltaTime;
                break;
            case eMoveDirection.RIGHT:
                movementVec.x += this.acceleration * deltaTime;
                break;
            case eMoveDirection.UP:
                movementVec.y += this.acceleration * deltaTime;
                break;
            }
        });

        var currentPos = this.node.position; 
        var targetPos = currentPos.add(movementVec);
        this.node.setPosition( targetPos.x, targetPos.y );
    }
}