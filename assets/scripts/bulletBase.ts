import { _decorator, Component, Node, Vec2, Vec3, RigidBody2D, UITransform, PolygonCollider2D, Contact2DType, Collider2D, IPhysics2DContact } from 'cc';
import { Maze_Common } from './common'
const { ccclass, property } = _decorator;

export namespace Maze_BulletBase
{ 
    @ccclass('BulletBase')
    export class BulletBase extends Component 
    {
        private _direction:Vec2 = new Vec2();
        private _shouldDestroy:boolean = false;

        public set collisionGroup(val:number)
        {
            var collisionGroup = 1 << val;

            var rigidBody = this.node.getComponent(RigidBody2D);

            if(null != rigidBody)
            {
                rigidBody.group = collisionGroup;
            }

            var collider = this.node.getComponent(Collider2D);

            if(null != collider)
            {
                collider.group = collisionGroup;
                collider.apply();
            }
        }

        private _bulletTimeAlive:number = 2;
        public get bulletTimeAlive() : number
        {
            return this._bulletTimeAlive;
        }
        public set bulletTimeAlive(val:number)
        {
            this._bulletTimeAlive = val;
        }

        private _bulletSpeed:number = 2;
        public get bulletSpeed() : number
        {
            return this._bulletSpeed;
        }
        public set bulletSpeed(val:number)
        {
            this._bulletSpeed = val * 10;
        }

        private _damage:number = 2;
        public get damage() : number
        {
            return this._damage;
        }

        onBeginContact (selfCollider:Collider2D, otherCollider:Collider2D, contact:IPhysics2DContact) 
        {
            if(true == this.node.isValid)
            {
                var selfRigidBody = selfCollider.node.getComponent(RigidBody2D);

                if(null != selfRigidBody)
                { 
                    selfRigidBody.linearVelocity = new Vec2(0,0);
                    selfRigidBody.angularVelocity = 0;
                }

                this._shouldDestroy = true;
            }
        }

        public onLoad ()
        {
            var polygonCollider2D = this.node.getComponent(PolygonCollider2D);

            if(null != polygonCollider2D)
            {
                polygonCollider2D.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            }
        }

        public start() 
        {

        }

        public fire(startingPosWorldCoord:Vec3, direction:Vec2, damage:number)
        {
            this._damage = damage;

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

            var rigidBody = this.getComponent(RigidBody2D);

            if(null != rigidBody)
            {
                var movementVec = this._direction.clone();

                if( rigidBody.linearVelocity.x < this._bulletSpeed ||
                rigidBody.linearVelocity.x > -this._bulletSpeed)
                {  
                    movementVec.x *= this._bulletSpeed;
                }

                if( rigidBody.linearVelocity.y < this._bulletSpeed ||
                rigidBody.linearVelocity.y > -this._bulletSpeed)
                {
                    movementVec.y *= this._bulletSpeed;
                }

                rigidBody.linearVelocity = movementVec;
            }
        }

        public update(deltaTime:number)
        {
            if(true == this.node.isValid)
            {
                if(true == this._shouldDestroy)
                {
                    this.node.destroy();
                }
            }
        }
    }
}