
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FollowingObject')
export class FollowingObject extends Component
{
    @property
    followedObject:Node = new Node();

    update (deltaTime:number)
    {
        var targetPosition = this.followedObject.position;
        var currentPosition = this.node.position.clone();
        currentPosition.lerp( targetPosition, 0.1 );
        this.node.setPosition( currentPosition.x, currentPosition.y );
    }
}