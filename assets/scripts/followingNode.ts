
import { _decorator, Component, Node, Vec3, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FollowingObject')
export class FollowingObject extends Component
{
    @property
    followedObject:Node = new Node();

    @property
    adjustmentX:number = 0;

    @property
    adjustmentY:number = 0;

    @property
    inheritRotation:boolean = false;

    update (deltaTime:number)
    {
        if(null != this.followedObject)
        {
            var followedObjectUITransform = this.followedObject.getComponent(UITransform);

            if(followedObjectUITransform != null)
            {
                var targetPosition = this.followedObject.position.clone();
                targetPosition.x += followedObjectUITransform.width * this.followedObject.scale.x * this.adjustmentX;
                targetPosition.y += followedObjectUITransform.height * this.followedObject.scale.y * this.adjustmentY;
                var currentPosition = this.node.position.clone();
                currentPosition.lerp( targetPosition, 0.1 );
                this.node.setPosition( currentPosition.x, currentPosition.y );

                if(true == this.inheritRotation)
                {
                    this.node.setRotation( this.followedObject.rotation );
                }
            }
        }
    }
}