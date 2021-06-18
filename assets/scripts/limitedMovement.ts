
import { _decorator, Component, Node, UITransform, Camera, renderer, Canvas, Game, game } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LimitedMovement')
export class LimitedMovement extends Component 
{
    @property
    limitingObject:Node = new Node();

    update (deltaTime:number)
    {
        var myUITransform = this.getComponent(UITransform);

        if(myUITransform != null)
        {
            var limitingUITransform = this.limitingObject.getComponent(UITransform);

            if(limitingUITransform != null)
            {
                var currentPosition = this.node.position.clone();

                var boundingBox = myUITransform.getBoundingBox();

                var minX = ( this.limitingObject.position.x - limitingUITransform.width / 2 ) + ( boundingBox.width / 2 );
                var maxX = ( this.limitingObject.position.x + limitingUITransform.width / 2 ) - ( boundingBox.width / 2 );
                var minY = ( this.limitingObject.position.y - limitingUITransform.height / 2 ) + ( boundingBox.height / 2 );
                var maxY = ( this.limitingObject.position.y + limitingUITransform.height / 2 ) - ( boundingBox.height / 2 );

                if(currentPosition.x >= maxX)
                {
                    currentPosition.x = maxX;
                }
                else if(currentPosition.x <= minX)
                {
                    currentPosition.x = minX;
                }
                
                if(currentPosition.y >= maxY)
                {
                    currentPosition.y = maxY;
                }
                else if(currentPosition.y <= minY)
                {
                    currentPosition.y = minY;
                }

                this.node.setPosition( currentPosition.x, currentPosition.y );
            }
        }
        else
        {
            var camera = this.getComponent(Camera);
            var canvas = game.canvas;

            if(camera != null && canvas != null)
            {
                if(camera.projection == renderer.scene.CameraProjection.ORTHO)
                {
                    var limitingUITransform = this.limitingObject.getComponent(UITransform);

                    if(limitingUITransform != null)
                    {
                        var currentPosition = this.node.position.clone();

                        let orthoHeight = camera.orthoHeight;
                        let orthoWidth = orthoHeight * (canvas.width / canvas.height);

                        var minX = ( this.limitingObject.position.x - limitingUITransform.width / 2 ) + ( orthoWidth );
                        var maxX = ( this.limitingObject.position.x + limitingUITransform.width / 2 ) - ( orthoWidth );
                        var minY = ( this.limitingObject.position.y - limitingUITransform.height / 2 ) + ( orthoHeight );
                        var maxY = ( this.limitingObject.position.y + limitingUITransform.height / 2 ) - ( orthoHeight );

                        console.log("minX - ", minX, "minY - ", minY, "maxX - ", maxX, "maxY - ", maxY);

                        if(currentPosition.x >= maxX)
                        {
                            currentPosition.x = maxX;
                        }
                        else if(currentPosition.x <= minX)
                        {
                            currentPosition.x = minX;
                        }
                        
                        if(currentPosition.y >= maxY)
                        {
                            currentPosition.y = maxY;
                        }
                        else if(currentPosition.y <= minY)
                        {
                            currentPosition.y = minY;
                        }

                        this.node.setPosition( currentPosition.x, currentPosition.y );
                    }
                }
            }
        }
    }
}