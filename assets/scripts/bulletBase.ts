import { _decorator, Component, Node, Vec2, Vec3, RigidBody2D, UITransform } from 'cc';
const { ccclass, property } = _decorator;

export namespace Maze_BulletBase
{ 
    @ccclass('BulletBase')
    export class BulletBase extends Component 
    {
        private _direction:Vec2 = new Vec2();

        public onLoad ()
        {

        }

        public start() 
        {

        }

        public fire(startingPosWorldCoord:Vec3, direction:Vec2)
        {
            var myUITranform = this.node.getComponent(UITransform);

            if(null != myUITranform)
            {
                this.node.setPosition( myUITranform.convertToNodeSpaceAR( startingPosWorldCoord ) );
            }

            this._direction = direction;

            this.schedule(()=> 
            {
                this.node.destroy();
            }, 2);
        }

        public update(delta:number)
        {
            if(null != this.node)
            {
                var rigidBody = this.getComponent(RigidBody2D);

                if(null != rigidBody)
                {
                    this._direction.x *= 100;
                    this._direction.y *= 100;
                    rigidBody.applyForceToCenter( this._direction, true );
                }
            }
        }
    }
}