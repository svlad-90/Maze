
import { _decorator, Component, Node, UITransform, Camera, renderer, Canvas, Game, game, RigidBody2D, Vec3, Vec2, Rect, Scene, Director, Mat4, Quat } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LimitedMovement')
export class LimitedMovement extends Component 
{
    @property
    limitingObject:Node = new Node();

    private canvas:Canvas|null = null;
    private zeroRotationQuat = new Quat();

    onLoad()
    {
        var scene:Scene|null = Director.instance.getScene();

        if(null != scene)
        {
            var canvasNode = scene.getChildByName("Canvas");

            if(null != canvasNode)
            {
                this.canvas = canvasNode.getComponent(Canvas);
            }
        }
    }

    convertToNodeSpaceARWithoutRotation(worldPoint: Vec3, out?: Vec3)
    {
        var matrixWithoutRotation:Mat4 = new Mat4();
        var zeroRotationQuat:Quat = new Quat();
        Quat.fromEuler(zeroRotationQuat, 0,0,0);
        Mat4.fromRTS(matrixWithoutRotation, zeroRotationQuat, this.node.position, this.node.scale);

        var worldMatrix:Mat4 = new Mat4();
        this.node.getWorldMatrix(worldMatrix);
        Mat4.invert(matrixWithoutRotation, worldMatrix);
        if (!out) {
            out = new Vec3();
        }

        return Vec3.transformMat4(out, worldPoint, matrixWithoutRotation);
    }

    update (deltaTime:number)
    {
        var myUITransform = this.getComponent(UITransform);

        if(myUITransform != null)
        {
            var camera = this.getComponent(Camera);

            if(camera != null)
            {
                if(camera.projection == renderer.scene.CameraProjection.PERSPECTIVE)
                {
                    if(null != this.canvas)
                    {
                        var canvasUITransform = this.canvas.getComponent(UITransform);
                        var limitingUITransform = this.limitingObject.getComponent(UITransform);
                        var myUITransform = this.node.getComponent(UITransform);

                        if(null != canvasUITransform && null != limitingUITransform && null != myUITransform)
                        {
                            var limitingObjectPosWorldCoord = limitingUITransform.convertToWorldSpaceAR(this.limitingObject.position);

                            var screenLeftBottomPointWorldCoord:Vec3 = camera.screenToWorld(new Vec3(0,0,limitingObjectPosWorldCoord.z));
                            var screenRightTopPointWorldCoord:Vec3 = camera.screenToWorld(new Vec3(canvasUITransform.contentSize.width,canvasUITransform.contentSize.height, limitingObjectPosWorldCoord.z));

                            var screenLeftBottomPointMyCoord:Vec3 = myUITransform.convertToNodeSpaceAR(screenLeftBottomPointWorldCoord);
                            var screenRightTopPointMyCoord:Vec3 = myUITransform.convertToNodeSpaceAR(screenRightTopPointWorldCoord);

                            var limitingObjectHalfSize:Vec3 = new Vec3( limitingUITransform.width/2 * this.limitingObject.scale.x, limitingUITransform.height/2 * this.limitingObject.scale.y, 0 );
                            var limitingObjectLeftBottomPointMyCoord = myUITransform.convertToNodeSpaceAR( limitingUITransform.convertToWorldSpaceAR( new Vec3( this.limitingObject.position.x - limitingObjectHalfSize.x, 
                                                                                    this.limitingObject.position.y - limitingObjectHalfSize.y, 
                                                                                    this.limitingObject.position.z - limitingObjectHalfSize.z ) ) );
                            var limitingObjectRightTopPointMyCoord = myUITransform.convertToNodeSpaceAR( limitingUITransform.convertToWorldSpaceAR( new Vec3( this.limitingObject.position.x + limitingObjectHalfSize.x, 
                                                                                    this.limitingObject.position.y + limitingObjectHalfSize.y, 
                                                                                    this.limitingObject.position.z + limitingObjectHalfSize.z ) ) );

                            limitingObjectLeftBottomPointMyCoord.x += ( (screenRightTopPointMyCoord.x - screenLeftBottomPointMyCoord.x) );
                            limitingObjectLeftBottomPointMyCoord.y += ( (screenRightTopPointMyCoord.y - screenLeftBottomPointMyCoord.y) );

                            limitingObjectRightTopPointMyCoord.x -= ( (screenRightTopPointMyCoord.x - screenLeftBottomPointMyCoord.x) );
                            limitingObjectRightTopPointMyCoord.y -= ( (screenRightTopPointMyCoord.y - screenLeftBottomPointMyCoord.y) );

                            var currentPosition = this.node.position.clone();

                            //console.log("limitingObjectLeftBottomPointMyCoord - ", limitingObjectLeftBottomPointMyCoord, ", limitingObjectRightTopPointMyCoord - ", limitingObjectRightTopPointMyCoord, 
                            //", screenLeftBottomPointMyCoord - ", screenLeftBottomPointMyCoord, ", screenRightTopPointMyCoord - ", screenRightTopPointMyCoord,
                            //", currentPosition - ", currentPosition);
                            
                            if(currentPosition.x <= limitingObjectLeftBottomPointMyCoord.x)
                            {
                                currentPosition.x = limitingObjectLeftBottomPointMyCoord.x;
                            }
                            else if(currentPosition.x >= limitingObjectRightTopPointMyCoord.x)
                            {
                                currentPosition.x = limitingObjectRightTopPointMyCoord.x;
                            }
                            
                            if(currentPosition.y <= limitingObjectLeftBottomPointMyCoord.y)
                            {
                                currentPosition.y = limitingObjectLeftBottomPointMyCoord.y;
                            }
                            else if(currentPosition.y >= limitingObjectRightTopPointMyCoord.y)
                            {
                                currentPosition.y = limitingObjectRightTopPointMyCoord.y;
                            }

                            this.node.setPosition( currentPosition.x, currentPosition.y );
                        }
                    }
                }
            }
            else
            {
                var limitingUITransform = this.limitingObject.getComponent(UITransform);

                if(limitingUITransform != null)
                {
                    var limitingObjectPosWorldCoord:Vec3 = this.limitingObject.worldPosition;

                    var minX = ( limitingObjectPosWorldCoord.x - ( limitingUITransform.width * this.limitingObject.scale.x / 2 ) ) + ( myUITransform.width * this.node.scale.x / 2 );
                    var minY = ( limitingObjectPosWorldCoord.y - ( limitingUITransform.height * this.limitingObject.scale.y / 2 ) ) + ( myUITransform.height * this.node.scale.y / 2 );
                    var maxX = ( limitingObjectPosWorldCoord.x + ( limitingUITransform.width * this.limitingObject.scale.x / 2 ) ) - ( myUITransform.width * this.node.scale.x / 2 );
                    var maxY = ( limitingObjectPosWorldCoord.y + ( limitingUITransform.height * this.limitingObject.scale.y / 2 ) ) - ( myUITransform.height * this.node.scale.y / 2 );

                    var limitingObjectLeftBottomPointMyCoord = this.convertToNodeSpaceARWithoutRotation( new Vec3(minX, minY, this.limitingObject.position.z) );
                    var limitingObjectRightTopPointMyCoord = this.convertToNodeSpaceARWithoutRotation( new Vec3(maxX, maxY, this.limitingObject.position.z) ); 

                    var currentPosition = this.node.position.clone();

                    var positionXAdjusted = false;

                    if(currentPosition.x <= limitingObjectLeftBottomPointMyCoord.x)
                    {
                        positionXAdjusted = true;
                        currentPosition.x = limitingObjectLeftBottomPointMyCoord.x;
                    }
                    else if(currentPosition.x >= limitingObjectRightTopPointMyCoord.x)
                    {
                        positionXAdjusted = true;
                        currentPosition.x = limitingObjectRightTopPointMyCoord.x;
                    }

                    var positionYAdjusted = false;
                    
                    if(currentPosition.y <= limitingObjectLeftBottomPointMyCoord.y)
                    {
                        positionYAdjusted = true;
                        currentPosition.y = limitingObjectLeftBottomPointMyCoord.y;
                    }
                    else if(currentPosition.y >= limitingObjectRightTopPointMyCoord.y)
                    {
                        positionYAdjusted = true;
                        currentPosition.y = limitingObjectRightTopPointMyCoord.y;
                    }

                    //console.log("limitingObjectLeftBottomPointMyCoord - ", limitingObjectLeftBottomPointMyCoord, ", limitingObjectRightTopPointMyCoord - ", limitingObjectRightTopPointMyCoord, 
                    //", currentPosition - ", currentPosition);

                    this.node.setPosition( currentPosition.x, currentPosition.y );

                    var rigidBody = this.getComponent(RigidBody2D);

                    if(rigidBody != null)
                    {
                        if(true == positionXAdjusted && false == positionYAdjusted)
                        {
                            rigidBody.linearVelocity = new Vec2(0, rigidBody.linearVelocity.y);
                        }
                        if(false == positionXAdjusted && true == positionYAdjusted)
                        {
                            rigidBody.linearVelocity = new Vec2(rigidBody.linearVelocity.x, 0);
                        }
                        if(true == positionXAdjusted && true == positionYAdjusted)
                        {
                            rigidBody.linearVelocity = new Vec2(0, 0);
                        }
                    }
                }
            }
        }
    }
}