
import { _decorator, Component, Node, sp, PolygonCollider2D, Contact2DType, Collider2D, IPhysics2DContact, RigidBody2D, Vec3, Vec2, misc, Graphics, math, UITransform, game, PhysicsSystem2D, ERaycast2DType} from 'cc';
import { Maze_BulletBase } from './bulletBase';
import { Maze_PlayerCursor } from './playerCursor';
import { Maze_Common } from './common'
import { Maze_WeaponTarget } from './weaponTarget';
import { Maze_FSM } from './common/FSM/FSM';
import { Maze_MapBuilder } from './map/mapBuilder'
import { Maze_GraphicsWall } from './wall/graphicsWall';
import { Maze_Observer } from './observer/observer';
const { ccclass, property } = _decorator;

export namespace Maze_EnemyBase
{
    enum EnemyFSMStateId
    {
        Idle = 0,
        ChasingPlayer = 1,
        BypassObstacle = 2,
        BypassObstacleCorner = 3,
        Death = 4,
        Destroy = 5,
        Final = 6
    }

    enum EnemyFSMTransitions
    {
        To_ChasingPlayer = 0,
        To_Idle = 1,
        To_BypassObstacle = 2,
        To_BypassObstacleCorner = 3,
        To_Death = 4,
        To_Destroy = 5,
        To_Final = 6
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

        @property
        debug:boolean = false;

        @property
        wallCollisionGroup:number = 0;

        private _FSMTransitionBlocked:boolean = false;

        private _cursorPlayerGridPositionObserver:Maze_Observer.Observer<Maze_PlayerCursor.CursorPlayerGridPositionContext> 
        = new Maze_Observer.Observer<Maze_PlayerCursor.CursorPlayerGridPositionContext>();
        
        private _graphicsNode:Node = new Node();

        private _map:Maze_MapBuilder.MapBuilder|null = null;
        public get map():Maze_MapBuilder.MapBuilder|null
        {
            return this._map;
        }
        public set map(val:Maze_MapBuilder.MapBuilder|null)
        {
            this._map = val;
        } 

        private _currentAngle = 0;
        private _targetDirection:Vec2 = new Vec2();
        private _movementDirection:number = 0;
        private _rigidBody:RigidBody2D|null = null;

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
        private _pathToPlayer:Vec2[] = [];

        constructor()
        {
            super();

            // Declaration of FSM states

            var idleState = new EnemyFSMState( EnemyFSMStateId.Idle, (context:EnemyFSMContext)=>
            {
                // enter
                var spineComp = this.getComponent(sp.Skeleton);

                if(spineComp != null)
                {
                    spineComp.setAnimation(0, "idle", true);
                }
            }, 
            (context:EnemyFSMContext)=>
            {
                // exit
            });

            var chasingPlayerState = new EnemyFSMState( EnemyFSMStateId.ChasingPlayer, (context:EnemyFSMContext)=>
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
            (context:EnemyFSMContext)=>
            {
                // exit
            });

            var bypassObstacleState = new EnemyFSMState( EnemyFSMStateId.BypassObstacle, (context:EnemyFSMContext)=>
            {
                var spineComp = this.getComponent(sp.Skeleton);
                                    
                if(spineComp != null)
                {
                    spineComp.setAnimation(0, "run", true);
                }

                this.updatePathToPlayer();
            }, 
            (context:EnemyFSMContext)=>
            {
                // exit
            });

            var bypassObstacleCornerState = new EnemyFSMState( EnemyFSMStateId.BypassObstacleCorner, (context:EnemyFSMContext)=>
            {
                var spineComp = this.getComponent(sp.Skeleton);
                                    
                if(spineComp != null)
                {
                    spineComp.setAnimation(0, "run", true);
                }

                this.updatePathToPlayer();

                this._FSMTransitionBlocked = true;

                this.scheduleOnce(()=>
                {
                    this._FSMTransitionBlocked = false;
                }, 0.25);
            }, 
            (context:EnemyFSMContext)=>
            {
                // exit
            });

            var deathState = new EnemyFSMState( EnemyFSMStateId.Death, (context:EnemyFSMContext)=>
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
            (context:EnemyFSMContext)=>
            {
                // exit
            });

            var destroyState = new EnemyFSMState( EnemyFSMStateId.Destroy, (context:EnemyFSMContext)=>
            {
                // enter
            }, 
            (context:EnemyFSMContext)=>
            {
                // exit
            });

            var finalState = new EnemyFSMState( EnemyFSMStateId.Final, (context:EnemyFSMContext)=>
            {
                // enter
            }, 
            (context:EnemyFSMContext)=>
            {
                // exit
            });

            // Declaration of transitions

            var From_Idle_To_ChasingPlayerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_ChasingPlayer, idleState, chasingPlayerState);
            var From_Idle_To_BypassObstacleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_BypassObstacle, idleState, bypassObstacleState);
            var From_Idle_To_BypassObstacleCornerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_BypassObstacleCorner, idleState, bypassObstacleCornerState);
            var From_Idle_To_DeathTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Death, idleState, deathState);
            
            var From_ChasingPlayer_To_IdleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Idle, chasingPlayerState, idleState);
            var From_ChasingPlayer_To_BypassObstacleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_BypassObstacle, chasingPlayerState, bypassObstacleState);
            var From_ChasingPlayer_To_BypassObstacleCornerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_BypassObstacleCorner, chasingPlayerState, bypassObstacleCornerState);
            var From_ChasingPlayer_To_DeathTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Death, chasingPlayerState, deathState);

            var From_BypassObstacle_To_IdleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Idle, bypassObstacleState, idleState);
            var From_BypassObstacle_To_ChasingPlayerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_ChasingPlayer, bypassObstacleState, chasingPlayerState);
            var From_BypassObstacle_To_BypassObstacleCornerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_BypassObstacleCorner, bypassObstacleState, bypassObstacleCornerState);
            var From_BypassObstacle_To_DeathTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Death, bypassObstacleState, deathState);

            var From_BypassObstacleCorner_To_IdleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Idle, bypassObstacleCornerState, idleState);
            var From_BypassObstacleCorner_To_ChasingPlayerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_ChasingPlayer, bypassObstacleCornerState, chasingPlayerState);
            var From_BypassObstacleCorner_To_BypassObstacleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_BypassObstacle, bypassObstacleCornerState, bypassObstacleState);
            var From_BypassObstacleCorner_To_DeathTransitionTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Death, bypassObstacleCornerState, deathState);

            var From_Death_To_DestroyTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Destroy, deathState, destroyState);
            var From_Destroy_To_FinalTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Final, destroyState, finalState);

            // Assignment of transitions to states
            
            idleState.addTransition( From_Idle_To_ChasingPlayerTransition );
            idleState.addTransition( From_Idle_To_BypassObstacleTransition );
            idleState.addTransition( From_Idle_To_BypassObstacleCornerTransition );
            idleState.addTransition( From_Idle_To_DeathTransition );
            
            chasingPlayerState.addTransition( From_ChasingPlayer_To_IdleTransition );
            chasingPlayerState.addTransition( From_ChasingPlayer_To_BypassObstacleTransition );
            chasingPlayerState.addTransition( From_ChasingPlayer_To_BypassObstacleCornerTransition );
            chasingPlayerState.addTransition( From_ChasingPlayer_To_DeathTransition );

            bypassObstacleState.addTransition( From_BypassObstacle_To_IdleTransition );
            bypassObstacleState.addTransition( From_BypassObstacle_To_ChasingPlayerTransition );
            bypassObstacleState.addTransition( From_BypassObstacle_To_BypassObstacleCornerTransition );
            bypassObstacleState.addTransition( From_BypassObstacle_To_DeathTransition );

            bypassObstacleCornerState.addTransition( From_BypassObstacleCorner_To_IdleTransition );
            bypassObstacleCornerState.addTransition( From_BypassObstacleCorner_To_ChasingPlayerTransition );
            bypassObstacleCornerState.addTransition( From_BypassObstacleCorner_To_BypassObstacleTransition );
            bypassObstacleCornerState.addTransition( From_BypassObstacleCorner_To_DeathTransitionTransition );

            deathState.addTransition( From_Death_To_DestroyTransition );

            destroyState.addTransition( From_Destroy_To_FinalTransition );

            // Creation of FSM
            var context:EnemyFSMContext = new EnemyFSMContext();
            this._FSM = new EnemyFSM(idleState, context);
        }

        onLoad()
        {
            
        }

        start()
        {
            this._rigidBody = this.node.getComponent(RigidBody2D);

            this._graphicsNode.addComponent(Graphics);

            if(null != this.node.parent)
            {
                this.node.parent.addChild(this._graphicsNode);
                this._graphicsNode.parent = this.node.parent;
            }

            if(null != this.playerInFocus)
            {

                this._cursorPlayerGridPositionObserver.setObserverCallback((data:Maze_PlayerCursor.CursorPlayerGridPositionContext) => 
                {
                    if(EnemyFSMStateId.BypassObstacle == this._FSM.currentState || 
                       EnemyFSMStateId.BypassObstacleCorner == this._FSM.currentState)
                    {
                        this.updatePathToPlayer();
                    }
                });

                this.playerInFocus.cursorPlayerGridPositionSubject.attach(this._cursorPlayerGridPositionObserver);
            }

            var collider2D = this.node.getComponent(Collider2D);

            if(null != collider2D)
            {
                collider2D.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            }

            this._FSM.init();
            this._FSM.applyTransition(EnemyFSMTransitions.To_BypassObstacle);
        }

        updatePathToPlayer()
        {
            if(null != this.map && null != this.playerInFocus)
            {
                this._pathToPlayer = this.map.findPath(this.map.pointToTile(Maze_Common.toVec2(this.node.worldPosition)), this.map.pointToTile(Maze_Common.toVec2(this.playerInFocus.node.worldPosition)));

                this.drawBypassObstaclePath();
            }
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

                var wall = otherCollider.node.getComponent(Maze_GraphicsWall.GraphicsWall);

                if(null != wall)
                {
                    this._FSM.applyTransition(EnemyFSMTransitions.To_BypassObstacleCorner);
                }
            }
        }

        private getMovementVec() : Vec3
        {
            var movementVec = new Vec3();
        
            if(EnemyFSMStateId.ChasingPlayer == this._FSM.currentState)
            {
                if(null != this.playerInFocus)
                {
                    var playerPositionWorldCoord = this.playerInFocus.node.worldPosition.clone();
                    var directionToPlayerWorldCoord = playerPositionWorldCoord.subtract( this.node.worldPosition ).normalize();

                    movementVec.x = directionToPlayerWorldCoord.x * this.acceleration * this.walkForce;
                    movementVec.y = directionToPlayerWorldCoord.y * this.acceleration * this.walkForce;
                }
            }
            else if(EnemyFSMStateId.BypassObstacle == this._FSM.currentState ||
                    EnemyFSMStateId.BypassObstacleCorner == this._FSM.currentState)
            {
                if(null != this.map)
                {
                    if(0 != this._pathToPlayer.length)
                    {
                        var vecLength = this._pathToPlayer[0].clone().subtract(Maze_Common.toVec2(this.node.worldPosition)).length();

                        if(Math.abs(vecLength) < 10)
                        {
                            this._pathToPlayer.shift();
                        }

                        if(0 != this._pathToPlayer.length)
                        {
                            var directionToPlayerWorldCoord_:Vec2 = this._pathToPlayer[0].clone().subtract(Maze_Common.toVec2(this.node.worldPosition)).normalize();

                            movementVec.x = directionToPlayerWorldCoord_.x * this.acceleration * this.walkForce;
                            movementVec.y = directionToPlayerWorldCoord_.y * this.acceleration * this.walkForce;
                        }
                    }
                }
            }

            return movementVec;
        }

        drawChasingPath()
        {
            if(true == this.debug)
            {
                var graphics = this._graphicsNode.getComponent(Graphics);

                if(null != graphics)
                {
                    var uiTransform = graphics.getComponent(UITransform);

                    if(null != uiTransform)
                    {
                        var localStartPosition = uiTransform.convertToNodeSpaceAR(this.node.worldPosition);
                        var localEndPosition = uiTransform.convertToNodeSpaceAR(this.playerInFocus.node.worldPosition);
                        graphics.clear();
                        graphics.moveTo(localStartPosition.x,localStartPosition.y);
                        graphics.lineTo(localEndPosition.x,localEndPosition.y);
                        graphics.close();
                        graphics.stroke();
                    }
                }
            }
        }

        drawBypassObstaclePath()
        {
            if(true == this.debug)
            {
                var graphics = this._graphicsNode.getComponent(Graphics);

                if(null != graphics)
                {
                    graphics.clear();

                    var uiTransform = graphics.getComponent(UITransform);

                    if(null != uiTransform)
                    {
                        var localStartPosition = uiTransform.convertToNodeSpaceAR(this.node.worldPosition);
                        graphics.moveTo(localStartPosition.x, localStartPosition.y);
                        graphics.strokeColor = new math.Color(255,0,0);
                        graphics.lineWidth = 20;
                        
                        if(0 != this._pathToPlayer.length)
                        {
                            for(var pathElement of this._pathToPlayer)
                            {
                                var localVertexPosition = uiTransform.convertToNodeSpaceAR(Maze_Common.toVec3(pathElement));
                                graphics.lineTo(localVertexPosition.x, localVertexPosition.y);
                            }
                        }

                        graphics.stroke();
                    }
                }
            }
        }

        determineStateRayCast()
        {
            if(false ==  this._FSMTransitionBlocked)
            {
                if(this._rigidBody != null)
                {
                    if(null != this.playerInFocus)
                    {
                        var raycastResult = PhysicsSystem2D.instance.raycast(this.node.worldPosition, this.playerInFocus.node.worldPosition, ERaycast2DType.All);

                        var collideWithWall:boolean = false;

                        for(var raycastElement of raycastResult)
                        {
                            if(raycastElement.collider.group == 1 << this.wallCollisionGroup)
                            {
                                collideWithWall = true;
                                break;
                            }
                        }

                        if(false == collideWithWall)
                        {
                            this._FSM.applyTransition(EnemyFSMTransitions.To_ChasingPlayer);
                        }
                        else
                        {
                            this._FSM.applyTransition(EnemyFSMTransitions.To_BypassObstacle);
                            this.drawBypassObstaclePath();
                        }

                        if(this._FSM.currentState == EnemyFSMStateId.ChasingPlayer)
                        {
                            this.drawChasingPath();
                        }
                    }
                }
            }
        }

        update_logic(deltaTime:number)
        {
            this.determineStateRayCast();

            if(this._rigidBody != null)
            {
                var movementVec = this.getMovementVec();

                if( this._rigidBody.linearVelocity.x < this.velocityMax ||
                    this._rigidBody.linearVelocity.x > -this.velocityMax)
                {
                    movementVec.x *= deltaTime;
                }
                else
                {
                    movementVec.x = 0;
                }

                if( this._rigidBody.linearVelocity.y < this.velocityMax ||
                    this._rigidBody.linearVelocity.y > -this.velocityMax)
                {
                    movementVec.y *= deltaTime;
                }
                else
                {
                    movementVec.y = 0;
                }

                this._rigidBody.applyForceToCenter( Maze_Common.toVec2(movementVec), true );
            }

            var targetWorldCoord = new Vec3();

            if(EnemyFSMStateId.ChasingPlayer == this._FSM.currentState)
            {
                if(null != this.playerInFocus)
                {
                    targetWorldCoord = this.playerInFocus.node.worldPosition;
                }
            }
            else if(EnemyFSMStateId.BypassObstacle == this._FSM.currentState ||
                    EnemyFSMStateId.BypassObstacleCorner == this._FSM.currentState)
            {
                if(0 != this._pathToPlayer.length)
                {
                    targetWorldCoord = Maze_Common.toVec3( this._pathToPlayer[0] );
                }
            }

            var nodeWorldCoord = this.node.worldPosition;

            var lookAtVec:Vec2 = new Vec2();

            lookAtVec.x = targetWorldCoord.x - nodeWorldCoord.x;
            lookAtVec.y = targetWorldCoord.y - nodeWorldCoord.y;

            var eyeDirection2D = new Vec2(this.eyesDirection.x, this.eyesDirection.y);
            var andgleRad:number = eyeDirection2D.signAngle( lookAtVec );
            var angleDeg:number = Math.floor( misc.radiansToDegrees(andgleRad) );

            if(Math.abs(angleDeg - this._currentAngle) > 10)
            {
                this.node.setRotationFromEuler( 0, 0, angleDeg );
                this._currentAngle = angleDeg;
            }
        }

        update_HandlingDelayedActions()
        {
            // handling delayed actions

            if(true == this._isTurnOffCollision)
            {
                if(this._rigidBody != null)
                {
                    if(null != this._rigidBody)
                    {
                        this._rigidBody.enabled = false;
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

                if(null != this._graphicsNode)
                {
                    if(null != this.node.parent)
                    {
                        this.node.parent.removeChild(this._graphicsNode);
                        this.node.addChild(this._graphicsNode);
                        this._graphicsNode.parent = this.node;
                    }
                }

                if(null != this.playerInFocus)
                {
                    this.playerInFocus.cursorPlayerGridPositionSubject.detach(this._cursorPlayerGridPositionObserver); 
                }

                this.node.destroy();
            }
        }

        update(deltaTime:number)
        {
            if(true == this.node.isValid)
            {
                this.update_logic(deltaTime);
                this.update_HandlingDelayedActions();
            }
        }
    }
}