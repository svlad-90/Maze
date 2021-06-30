
import { _decorator, Component, Node, UITransform } from 'cc';
const { ccclass, property } = _decorator;

namespace Maze_FollowingObject
{
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
                var myUITransform = this.followedObject.getComponent(UITransform);

                if(followedObjectUITransform != null && myUITransform != null)
                {
                    var targetPositionWorldCoord = followedObjectUITransform.convertToWorldSpaceAR( this.followedObject.position );
                    targetPositionWorldCoord.x += followedObjectUITransform.width * this.followedObject.scale.x * this.adjustmentX;
                    targetPositionWorldCoord.y += followedObjectUITransform.height * this.followedObject.scale.y * this.adjustmentY;
                    var currentPosition = this.node.position.clone();

                    currentPosition.lerp( myUITransform.convertToNodeSpaceAR( targetPositionWorldCoord ), 0.1 );
                    this.node.setPosition( currentPosition.x, currentPosition.y );

                    if(true == this.inheritRotation)
                    {
                        this.node.setRotation( this.followedObject.rotation );
                    }
                }
            }
        }
    }
}