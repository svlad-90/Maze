
import { _decorator, Component, Node, sp, PolygonCollider2D, Contact2DType, Collider2D, IPhysics2DContact, RigidBody2D, Vec3, Vec2, misc } from 'cc';
import { Maze_BulletBase } from './bulletBase';
import { Maze_PlayerCursor } from './playerCursor';
import { Maze_Common } from './common'
import { Maze_WeaponTarget } from './weaponTarget';
import { Maze_FSM } from './common/FSM/FSM';
import { Maze_GraphicsWall } from './wall/graphicsWall'
const { ccclass, property } = _decorator;

export namespace Maze_EnemyBase
{
    enum EnemyFSMStateId
    {
        Idle = 0,
        ChasingPlayer = 1,
        BypassObstacle = 2,
        Death = 3,
        Destroy = 4,
        Final = 5
    }

    enum EnemyFSMTransitions
    {
        To_ChasingPlayer = 0,
        To_Idle = 1,
        To_BypassObstacle = 2,
        To_Death = 3,
        To_Destroy = 4,
        To_Final = 5
    }

    class EnemyFSMContext
    {

    }

    class EnemyFSM extends Maze_FSM.FSM<EnemyFSMStateId, EnemyFSMTransitions, EnemyFSMContext>{}
    class EnemyFSMState extends Maze_FSM.State<EnemyFSMStateId, EnemyFSMTransitions, EnemyFSMContext>{}
    class EnemyFSMTransition extends Maze_FSM.Transition<EnemyFSMStateId, EnemyFSMTransitions, EnemyFSMContext>{}

    @ccclass('EnemyBase')
    export class EnemyBase extends Component 
    {
        @property
        health:number = 100;

        @property ( Maze_PlayerCursor.PlayerCursor )
        playerInFocus:Maze_PlayerCursor.PlayerCursor = new Maze_PlayerCursor.PlayerCursor();

        @property
        eyesDirection:Vec3 = new Vec3(0,1,0);

        @property
        acceleration:number = 0;

        @property
        velocityMax:number = 0;

        private _currentAngle = 0;
        private _targetDirection:Vec2 = new Vec2();
        private _movementDirection:number = 0;

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

        private _FSM:EnemyFSM;

        constructor()
        {
            super();

            // Declaration of FSM states

            var idleState = new EnemyFSMState( EnemyFSMStateId.Idle, (EnemyFSMStateId:EnemyFSMStateId, context:EnemyFSMContext)=>
            {
                // enter
                var spineComp = this.getComponent(sp.Skeleton);

                if(spineComp != null)
                {
                    spineComp.setAnimation(0, "idle", true);
                }
            }, 
            (EnemyFSMStateId:EnemyFSMStateId, context:EnemyFSMContext)=>
            {
                // exit
            });

            var chasingPlayerState = new EnemyFSMState( EnemyFSMStateId.ChasingPlayer, (EnemyFSMStateId:EnemyFSMStateId, context:EnemyFSMContext)=>
            {
                var spineComp = this.getComponent(sp.Skeleton);
                                    
                if(spineComp != null)
                {
                    spineComp.setAnimation(0, "run", true);
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
            }, 
            (EnemyFSMStateId:EnemyFSMStateId, context:EnemyFSMContext)=>
            {
                // exit
            });

            var bypassObstacleState = new EnemyFSMState( EnemyFSMStateId.BypassObstacle, (EnemyFSMStateId:EnemyFSMStateId, context:EnemyFSMContext)=>
            {
                // enter
            }, 
            (EnemyFSMStateId:EnemyFSMStateId, context:EnemyFSMContext)=>
            {
                // exit
            });

            var deathState = new EnemyFSMState( EnemyFSMStateId.Death, (EnemyFSMStateId:EnemyFSMStateId, context:EnemyFSMContext)=>
            {
                // enter
                var spineComp = this.getComponent(sp.Skeleton);
                                        
                if(spineComp != null)
                {
                    this._needToSendDeathNotificationCallbacks = true;

                    spineComp.setAnimation(0, "death", false);

                    this._isTurnOffCollision = true;

                    var weapon = this.node.getComponent(Maze_WeaponTarget.WeaponTarget);
                    if(null != weapon)
                    {
                        weapon.fireOff();
                    }
                }

                var spineComp = this.getComponent(sp.Skeleton);

                if(spineComp != null)
                {
                    spineComp.setCompleteListener((x: spine.TrackEntry)=>
                    {
                        if(x.animation.name == "death")
                        {
                            this._FSM.applyTransition(EnemyFSMTransitions.To_Destroy);
                        }
                    });
                }
            }, 
            (EnemyFSMStateId:EnemyFSMStateId, context:EnemyFSMContext)=>
            {
                // exit
            });

            var destroyState = new EnemyFSMState( EnemyFSMStateId.Destroy, (EnemyFSMStateId:EnemyFSMStateId, context:EnemyFSMContext)=>
            {
                // enter
            }, 
            (EnemyFSMStateId:EnemyFSMStateId, context:EnemyFSMContext)=>
            {
                // exit
            });

            var finalState = new EnemyFSMState( EnemyFSMStateId.Final, (EnemyFSMStateId:EnemyFSMStateId, context:EnemyFSMContext)=>
            {
                // enter
            }, 
            (EnemyFSMStateId:EnemyFSMStateId, context:EnemyFSMContext)=>
            {
                // exit
            });

            // Declaration of transitions

            var From_Idle_To_ChasingPlayerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_ChasingPlayer, idleState, chasingPlayerState);
            var From_ChasingPlayer_To_IdleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Idle, chasingPlayerState, idleState);
            var From_Idle_To_BypassObstacleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_BypassObstacle, idleState, bypassObstacleState);
            var From_BypassObstacle_To_IdleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Idle, bypassObstacleState, idleState);
            var From_ChasingPlayer_To_BypassObstacleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_BypassObstacle, chasingPlayerState, bypassObstacleState);
            var From_BypassObstacle_To_ChasingPlayerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_ChasingPlayer, bypassObstacleState, chasingPlayerState);
            var From_Idle_To_DeathTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Death, idleState, deathState);
            var From_ChasingPlayer_To_DeathTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Death, chasingPlayerState, deathState);
            var From_BypassObstacle_To_DeathTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Death, bypassObstacleState, deathState);
            var From_Death_To_DestroyTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Destroy, deathState, destroyState);
            var From_Destroy_To_FinalTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Final, destroyState, finalState);

            // Assignment of transitions to states
            
            idleState.addTransition( From_Idle_To_ChasingPlayerTransition );
            idleState.addTransition( From_Idle_To_BypassObstacleTransition );
            idleState.addTransition( From_Idle_To_DeathTransition );
            
            chasingPlayerState.addTransition( From_ChasingPlayer_To_IdleTransition );
            chasingPlayerState.addTransition( From_ChasingPlayer_To_BypassObstacleTransition );
            chasingPlayerState.addTransition( From_ChasingPlayer_To_DeathTransition );

            bypassObstacleState.addTransition( From_BypassObstacle_To_IdleTransition );
            bypassObstacleState.addTransition( From_BypassObstacle_To_ChasingPlayerTransition );
            bypassObstacleState.addTransition( From_BypassObstacle_To_DeathTransition );

            deathState.addTransition( From_Death_To_DestroyTransition );

            destroyState.addTransition( From_Destroy_To_FinalTransition );

            // Creation of FSM
            var context:EnemyFSMContext = new EnemyFSMContext();
            this._FSM = new EnemyFSM(idleState, context);
        }

        onLoad()
        {
            
        }

        start () 
        {
            var collider2D = this.node.getComponent(Collider2D);

            if(null != collider2D)
            {
                collider2D.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            }

            this._FSM.init();
            this._FSM.applyTransition(EnemyFSMTransitions.To_ChasingPlayer);
        }

        onBeginContact (selfCollider:Collider2D, otherCollider:Collider2D, contact:IPhysics2DContact) 
        {
            if(true == this.node.isValid)
            {
                var bullet = otherCollider.node.getComponent(Maze_BulletBase.BulletBase);

                if(null != bullet)
                { 
                    if(true == bullet.isDamageActive)
                    {
                        bullet.deactivate();

                        this.health -= bullet.damage;

                        if(this.health <= 0)
                        {
                            this._FSM.applyTransition(EnemyFSMTransitions.To_Death);
                        }
                    }
                }

                // var wall = otherCollider.node.getComponent(Maze_GraphicsWall.GraphicsWall);

                // if(null != wall)
                // {
                //     this._FSM.applyTransition(EnemyFSMTransitions.To_BypassObstacle);
                // }
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

        update_ChasingLogic(deltaTime:number)
        {
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
                var angleDeg:number = Math.floor( misc.radiansToDegrees(andgleRad) );

                if(Math.abs(angleDeg - this._currentAngle) > 10)
                {
                    this.node.setRotationFromEuler( 0, 0, angleDeg );
                    this._currentAngle = angleDeg;
                }
            }
        }

        update_BypassObstacle(deltaTime:number)
        {

        }

        update_HandlingDelayedActions()
        {
            // handling delayed actions

            if(true == this._isTurnOffCollision)
            {
                var rigidBody = this.getComponent(RigidBody2D);

                if(rigidBody != null)
                {
                    if(null != rigidBody)
                    {
                        rigidBody.enabled = false;
                    }

                    this._isTurnOffCollision = false;
                }
            }

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

            if(EnemyFSMStateId.Destroy == this._FSM.currentState)
            {
                this._FSM.applyTransition(EnemyFSMTransitions.To_Final);
                this.node.destroy();
            }
        }

        update(deltaTime:number)
        {
            if(true == this.node.isValid)
            {
                if(EnemyFSMStateId.ChasingPlayer == this._FSM.currentState)
                {
                    this.update_ChasingLogic(deltaTime);
                }
                else if(EnemyFSMStateId.BypassObstacle == this._FSM.currentState)
                {
                    this.update_BypassObstacle(deltaTime);
                }

                this.update_HandlingDelayedActions();
            }
        }
    }
}