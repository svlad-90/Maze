
import { _decorator, Component, Node, sp, PolygonCollider2D, Contact2DType, Collider2D, IPhysics2DContact, RigidBody2D, Vec3, Vec2, misc } from 'cc';
import { Maze_BulletBase } from './bulletBase';
import { Maze_PlayerCursor } from './playerCursor';
import { Maze_Common } from './common'
import { Maze_WeaponTarget } from './weaponTarget';
const { ccclass, property } = _decorator;

export namespace Maze_EnemyBase
{
    @ccclass('EnemyBase')
    export class EnemyBase extends Component 
    {
        @property
        health:number = 100;

        @property
        playerInFocus:Maze_PlayerCursor.PlayerCursor = new Maze_PlayerCursor.PlayerCursor();

        @property
        eyesDirection:Vec3 = new Vec3(0,1,0);

        @property
        acceleration:number = 0;

        @property
        velocityMax:number = 0;

        private _isDeathPlaying:boolean = false;
        private _isDestroy:boolean = false;
        private _isTurnOffCollision:boolean = false;

        private _needToSendDeathNotificationCallbacks:boolean = false; 

        private _deathNotificationCallbacks : (((node:Node) => void) | null)[] = [];
        public addDeathNotificationCallback(val:((node:Node) => void) | null)
        {
            if(null != val)
            {
                this._deathNotificationCallbacks.push(val);
            }
        }
        public removeDeathNotificationCallback(val:((node:Node) => void) | null)
        {
            if(null != val)
            {
                const index = this._deathNotificationCallbacks.indexOf(val, 0);
                if (index > -1) 
                {
                    this._deathNotificationCallbacks.splice(index, 1);
                }
            }
        }

        private _walkForce:number = 300;
        public get walkForce() : number
        {
            return this._walkForce;
        }

        onLoad()
        {
            
        }

        start () 
        {
            var spineComp = this.getComponent(sp.Skeleton);
                                    
            if(spineComp != null)
            {
                spineComp.setAnimation(0, "run", true);

                spineComp.setCompleteListener((x: spine.TrackEntry)=>
                {
                    if(x.animation.name == "death")
                    {
                        this._isDeathPlaying = false;
                        this._isDestroy = true;
                    }
                });
            }

            var collider2D = this.node.getComponent(Collider2D);

            if(null != collider2D)
            {
                collider2D.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            }

            if(null != this.playerInFocus)
            {
                var weapon = this.node.getComponent(Maze_WeaponTarget.WeaponTarget);

                if(null != weapon)
                {
                    if(true == weapon.fireAllowed)
                    {
                        weapon.target = this.playerInFocus.node;
                        weapon.fireOn();
                    }
                }
            }
        }

        onBeginContact (selfCollider:Collider2D, otherCollider:Collider2D, contact:IPhysics2DContact) 
        {
            if(true == this.node.isValid)
            {
                var bullet = otherCollider.node.getComponent(Maze_BulletBase.BulletBase);

                if(null != bullet)
                { 
                    this.health -= bullet.damage;

                    if(this.health <= 0)
                    {
                        var spineComp = this.getComponent(sp.Skeleton);
                                    
                        if(spineComp != null)
                        {
                            if(false == this._isDeathPlaying)
                            {
                                this._needToSendDeathNotificationCallbacks = true;

                                spineComp.setAnimation(0, "death", false);
                                this._isDeathPlaying = true;
                                this._isTurnOffCollision = true;

                                var weapon = this.node.getComponent(Maze_WeaponTarget.WeaponTarget);
                                if(null != weapon)
                                {
                                    weapon.fireOff();
                                }
                            }
                        }
                    }
                }
            }
        }

        private getMovementVec() : Vec3
        {
            var movementVec = new Vec3();
        
            if(null != this.playerInFocus)
            {
                var playerPositionWorldCoord = this.playerInFocus.node.worldPosition.clone();
                var directionToPlayerWorldCoord = playerPositionWorldCoord.subtract( this.node.worldPosition ).normalize();

                movementVec.x = directionToPlayerWorldCoord.x * this.acceleration * this.walkForce;
                movementVec.y = directionToPlayerWorldCoord.y * this.acceleration * this.walkForce;
            }

            return movementVec;
        }

        update(deltaTime:number)
        {
            if(true == this.node.isValid)
            {
                if(true == this._needToSendDeathNotificationCallbacks)
                {
                    this._deathNotificationCallbacks.forEach(element => 
                    {
                        if(null != element)
                        {
                            element(this.node);
                        }
                    });

                    this._needToSendDeathNotificationCallbacks = false;
                }

                var rigidBody = this.getComponent(RigidBody2D);

                if(rigidBody != null)
                {
                    var movementVec = this.getMovementVec().clone();

                    if( rigidBody.linearVelocity.x < this.velocityMax ||
                    rigidBody.linearVelocity.x > -this.velocityMax)
                    {
                        movementVec.x *= deltaTime;
                    }
                    else
                    {
                        movementVec.x = 0;
                    }

                    if( rigidBody.linearVelocity.y < this.velocityMax ||
                    rigidBody.linearVelocity.y > -this.velocityMax)
                    {
                        movementVec.y *= deltaTime;
                    }
                    else
                    {
                        movementVec.y = 0;
                    }

                    rigidBody.applyForceToCenter( Maze_Common.toVec2(movementVec), true );
                }

                if(null != this.playerInFocus)
                {
                    var nodeWorldCoord = this.node.worldPosition
                    var playerWorldCoord = this.playerInFocus.node.worldPosition;

                    var lookAtVec:Vec2 = new Vec2();

                    lookAtVec.x = playerWorldCoord.x - nodeWorldCoord.x;
                    lookAtVec.y = playerWorldCoord.y - nodeWorldCoord.y;

                    var eyeDirection2D = new Vec2(this.eyesDirection.x, this.eyesDirection.y);
                    var andgleRad:number = eyeDirection2D.signAngle( lookAtVec );
                    var angleDeg:number = misc.radiansToDegrees(andgleRad);

                    this.node.setRotationFromEuler( 0, 0, angleDeg );
                }

                if(true == this._isTurnOffCollision)
                {
                    if(null != rigidBody)
                    {
                        rigidBody.enabled = false;
                    }

                    this._isTurnOffCollision = false;
                }

                if(true == this._isDestroy)
                {
                    this.node.destroy();
                    this._isDestroy = false;
                }
            }
        }
    }
}