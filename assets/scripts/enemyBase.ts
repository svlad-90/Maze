
import { _decorator, Component, Node, sp, PolygonCollider2D, Contact2DType, Collider2D, 
    IPhysics2DContact, RigidBody2D, Vec3, Vec2, misc, Graphics, math, UITransform, game, 
    PhysicsSystem2D, ERaycast2DType, Color, tween, Tween} from 'cc';
import { Maze_BulletBase } from './bulletBase';
import { Maze_PlayerCursor } from './playerCursor';
import { Maze_Common } from './common'
import { Maze_WeaponTarget } from './weaponTarget';
import { Maze_FSM } from './common/FSM/FSM';
import { Maze_MapBuilder } from './map/mapBuilder'
import { Maze_GraphicsWall } from './wall/graphicsWall';
import { Maze_Observer } from './observer/observer';
import { Maze_DebugGraphics } from './common/debugGraphics';
const { ccclass, property } = _decorator;

export namespace Maze_EnemyBase
{
    export class DestroyEnemyContext 
    {
        constructor(enemy:Node)
        {
            this.enemy = enemy;
        }
        enemy:Node; 
    }

    export class DeathEnemyContext 
    {
        constructor(enemy:Node)
        {
            this.enemy = enemy;
        }
        enemy:Node; 
    }

    enum EnemyFSMStateId
    {
        Idle = 0,
        ChasingPlayer = 1,
        AttackPlayer = 2,
        BypassObstacle = 3,
        BypassObstacleCorner = 4,
        Death = 5,
        Destroy = 6,
        Final = 7
    }

    enum EnemyFSMTransitions
    {
        To_Idle = 0,
        To_ChasingPlayer = 1,
        To_AttackPlayer = 2,
        To_BypassObstacle = 3,
        To_BypassObstacleCorner = 4,
        To_Death = 5,
        To_Destroy = 6,
        To_Final = 7
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
        public destroyEnemySubject:Maze_Observer.Subject<DestroyEnemyContext> = 
        new Maze_Observer.Subject<DestroyEnemyContext>();

        public deathEnemySubject:Maze_Observer.Subject<DeathEnemyContext> = 
        new Maze_Observer.Subject<DeathEnemyContext>();

        @property
        health:number = 100;

        private _initalHealth:number = 0;
        private _shouldNotifyDeath:boolean = false;
        private _shouldNotifyDestroy:boolean = false;
        private _fadeInTween:Tween<Color>|null = null;

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

        private _FSMTransitionBlocked:boolean = false;

        private _cursorPlayerGridPositionObserver:Maze_Observer.Observer<Maze_PlayerCursor.CursorPlayerGridPositionContext> 
        = new Maze_Observer.Observer<Maze_PlayerCursor.CursorPlayerGridPositionContext>();
        
        private _debugGraphics:Maze_DebugGraphics.DebugGraphics|null = null;

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

        private _walkForce:number = 200000;
        public get walkForce() : number
        {
            return this._walkForce;
        }

        private _FSM:EnemyFSM;
        private _pathToPlayer:Vec2[] = [];

        private _uiTransform:UITransform|null = null;
        private _playerUiTransform:UITransform|null = null;

        private _maxLength:number = 0;

        private startFire()
        {
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

        private stopFire()
        {
            var weapon = this.node.getComponent(Maze_WeaponTarget.WeaponTarget);
            if(null != weapon)
            {
                weapon.fireOff();
            }
        }

        createFSM() : EnemyFSM
        {
            // Declaration of FSM states
            var idleState = new EnemyFSMState( EnemyFSMStateId.Idle, (context:EnemyFSMContext)=>
            {
                // enter
                if(null != this._rigidBody)
                {
                    this._rigidBody.sleep();
                }
                
                this.schedule(()=>
                {
                    this.determineState();
                },0.1);

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
                if(null != this._rigidBody)
                {
                    this._rigidBody.wakeUp();
                }

                var spineComp = this.getComponent(sp.Skeleton);
                                    
                if(spineComp != null)
                {
                    spineComp.setAnimation(0, "run", true);
                }

                this.startFire();
            }, 
            (context:EnemyFSMContext)=>
            {
                // exit
            });

            var attackPlayerState = new EnemyFSMState( EnemyFSMStateId.AttackPlayer, (context:EnemyFSMContext)=>
            {
                if(null != this._rigidBody)
                {
                    this._rigidBody.sleep();
                    this._rigidBody.linearVelocity = new Vec2(0,0);
                }

                var spineComp = this.getComponent(sp.Skeleton);
                                    
                if(spineComp != null)
                {
                    spineComp.animation
                    spineComp.setAnimation(0, "idle", false);
                }

                this.startFire();
            }, 
            (context:EnemyFSMContext)=>
            {
                // exit
            });

            var bypassObstacleState = new EnemyFSMState( EnemyFSMStateId.BypassObstacle, (context:EnemyFSMContext)=>
            {
                if(null != this._rigidBody)
                {
                    this._rigidBody.wakeUp();
                }

                var spineComp = this.getComponent(sp.Skeleton);
                                    
                if(spineComp != null)
                {
                    spineComp.setAnimation(0, "run", true);
                }

                this.updatePathToPlayer();

                this.stopFire();
            }, 
            (context:EnemyFSMContext)=>
            {
                // exit
            });

            var bypassObstacleCornerState = new EnemyFSMState( EnemyFSMStateId.BypassObstacleCorner, (context:EnemyFSMContext)=>
            {
                if(null != this._rigidBody)
                {
                    this._rigidBody.wakeUp();
                }

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
                if(null != this._rigidBody)
                {
                    this._rigidBody.sleep();
                }

                this._shouldNotifyDeath = true;
                this.unscheduleAllCallbacks();
                var spineComp = this.getComponent(sp.Skeleton);
                                        
                if(spineComp != null)
                {
                    spineComp.setAnimation(0, "death", false);

                    this._isTurnOffCollision = true;

                    this.stopFire();

                    if(null != this._debugGraphics)
                    {
                        this._debugGraphics.parent = this.node;
                        this._debugGraphics.clear();
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
                if(null != this._rigidBody)
                {
                    this._rigidBody.sleep();
                }

                this.stopFadeIn();
                this._shouldNotifyDestroy = true;
            }, 
            (context:EnemyFSMContext)=>
            {
                // exit
            });

            var finalState = new EnemyFSMState( EnemyFSMStateId.Final, (context:EnemyFSMContext)=>
            {
                // enter
                if(null != this._rigidBody)
                {
                    this._rigidBody.sleep();
                }
            }, 
            (context:EnemyFSMContext)=>
            {
                // exit
            });

            // Declaration of transitions

            var From_Idle_To_ChasingPlayerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_ChasingPlayer, idleState, chasingPlayerState);
            var From_Idle_To_AttackPlayerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_AttackPlayer, idleState, attackPlayerState);
            var From_Idle_To_BypassObstacleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_BypassObstacle, idleState, bypassObstacleState);
            var From_Idle_To_BypassObstacleCornerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_BypassObstacleCorner, idleState, bypassObstacleCornerState);
            var From_Idle_To_DeathTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Death, idleState, deathState);
            
            var From_ChasingPlayer_To_IdleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Idle, chasingPlayerState, idleState);
            var From_ChasingPlayer_To_AttackPlayerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_AttackPlayer, chasingPlayerState, attackPlayerState);
            var From_ChasingPlayer_To_BypassObstacleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_BypassObstacle, chasingPlayerState, bypassObstacleState);
            var From_ChasingPlayer_To_BypassObstacleCornerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_BypassObstacleCorner, chasingPlayerState, bypassObstacleCornerState);
            var From_ChasingPlayer_To_DeathTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Death, chasingPlayerState, deathState);

            var From_AttackPlayer_To_IdleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Idle, attackPlayerState, idleState);
            var From_AttackPlayer_To_ChasingPlayerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_ChasingPlayer, attackPlayerState, chasingPlayerState);
            var From_AttackPlayer_To_BypassObstacleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_BypassObstacle, attackPlayerState, bypassObstacleState);
            var From_AttackPlayer_To_BypassObstacleCornerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_BypassObstacleCorner, attackPlayerState, bypassObstacleCornerState);
            var From_AttackPlayer_To_DeathTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Death, attackPlayerState, deathState);

            var From_BypassObstacle_To_IdleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Idle, bypassObstacleState, idleState);
            var From_BypassObstacle_To_ChasingPlayerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_ChasingPlayer, bypassObstacleState, chasingPlayerState);
            var From_BypassObstacle_To_AttackPlayerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_AttackPlayer, bypassObstacleState, attackPlayerState);
            var From_BypassObstacle_To_BypassObstacleCornerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_BypassObstacleCorner, bypassObstacleState, bypassObstacleCornerState);
            var From_BypassObstacle_To_DeathTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Death, bypassObstacleState, deathState);

            var From_BypassObstacleCorner_To_IdleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Idle, bypassObstacleCornerState, idleState);
            var From_BypassObstacleCorner_To_ChasingPlayerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_ChasingPlayer, bypassObstacleCornerState, chasingPlayerState);
            var From_BypassObstacleCorner_To_AttackPlayerTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_AttackPlayer, bypassObstacleCornerState, attackPlayerState);
            var From_BypassObstacleCorner_To_BypassObstacleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_BypassObstacle, bypassObstacleCornerState, bypassObstacleState);
            var From_BypassObstacleCorner_To_DeathTransitionTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Death, bypassObstacleCornerState, deathState);

            var From_Death_To_DestroyTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Destroy, deathState, destroyState);
            var From_Destroy_To_FinalTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Final, destroyState, finalState);

            var From_Final_To_IdleTransition = new EnemyFSMTransition(EnemyFSMTransitions.To_Idle, finalState, idleState);

            // Assignment of transitions to states
            
            idleState.addTransition( From_Idle_To_ChasingPlayerTransition );
            idleState.addTransition( From_Idle_To_AttackPlayerTransition );
            idleState.addTransition( From_Idle_To_BypassObstacleTransition );
            idleState.addTransition( From_Idle_To_BypassObstacleCornerTransition );
            idleState.addTransition( From_Idle_To_DeathTransition );
            
            chasingPlayerState.addTransition( From_ChasingPlayer_To_IdleTransition );
            chasingPlayerState.addTransition( From_ChasingPlayer_To_AttackPlayerTransition );
            chasingPlayerState.addTransition( From_ChasingPlayer_To_BypassObstacleTransition );
            chasingPlayerState.addTransition( From_ChasingPlayer_To_BypassObstacleCornerTransition );
            chasingPlayerState.addTransition( From_ChasingPlayer_To_DeathTransition );

            attackPlayerState.addTransition( From_AttackPlayer_To_IdleTransition );
            attackPlayerState.addTransition( From_AttackPlayer_To_ChasingPlayerTransition );
            attackPlayerState.addTransition( From_AttackPlayer_To_BypassObstacleTransition );
            attackPlayerState.addTransition( From_AttackPlayer_To_BypassObstacleCornerTransition );
            attackPlayerState.addTransition( From_AttackPlayer_To_DeathTransition );

            bypassObstacleState.addTransition( From_BypassObstacle_To_IdleTransition );
            bypassObstacleState.addTransition( From_BypassObstacle_To_ChasingPlayerTransition );
            bypassObstacleState.addTransition( From_BypassObstacle_To_AttackPlayerTransition );
            bypassObstacleState.addTransition( From_BypassObstacle_To_BypassObstacleCornerTransition );
            bypassObstacleState.addTransition( From_BypassObstacle_To_DeathTransition );

            bypassObstacleCornerState.addTransition( From_BypassObstacleCorner_To_IdleTransition );
            bypassObstacleCornerState.addTransition( From_BypassObstacleCorner_To_ChasingPlayerTransition );
            bypassObstacleState.addTransition( From_BypassObstacleCorner_To_AttackPlayerTransition );
            bypassObstacleCornerState.addTransition( From_BypassObstacleCorner_To_BypassObstacleTransition );
            bypassObstacleCornerState.addTransition( From_BypassObstacleCorner_To_DeathTransitionTransition );

            deathState.addTransition( From_Death_To_DestroyTransition );

            destroyState.addTransition( From_Destroy_To_FinalTransition );

            finalState.addTransition( From_Final_To_IdleTransition );

            // Creation of FSM
            var context:EnemyFSMContext = new EnemyFSMContext();
            return new EnemyFSM(idleState, context);
        }

        constructor()
        {
            super();
            this._FSM = this.createFSM();
        }

        onLoad()
        {
            
        }

        start()
        {
            this._initalHealth = this.health;
            this._uiTransform = this.node.getComponent(UITransform);

            if(true == this.debug)
            {
                this._debugGraphics = new Maze_DebugGraphics.DebugGraphics(this.node.parent);
            }

            this._rigidBody = this.node.getComponent(RigidBody2D);

            var collider2D = this.node.getComponent(Collider2D);
            if(null != collider2D)
            {
                collider2D.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            }

            if(null != this.playerInFocus)
            {
                this._playerUiTransform = this.playerInFocus.node.getComponent(UITransform);
            }

            if(null != this._playerUiTransform && null != this._uiTransform)
            {
                this._maxLength = this._playerUiTransform.contentSize.y * this.node.scale.y / 2 + this._uiTransform.contentSize.y * this.playerInFocus.node.scale.y / 2 + 50;
            }

            this._FSM.init();
            this._FSM.applyTransition(EnemyFSMTransitions.To_BypassObstacle);
        }

        reuse()
        {
            this.health = this._initalHealth;
            this._FSM.applyTransition(EnemyFSMTransitions.To_Idle);
            this._FSM.applyTransition(EnemyFSMTransitions.To_BypassObstacle);

            if(this._rigidBody != null)
            {
                if(null != this._rigidBody)
                {
                    this._rigidBody.enabled = true;
                }
            }
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

        drawBypassObstaclePath()
        {
            if(null != this._debugGraphics)
            {
                this._debugGraphics.clear();
                this._debugGraphics.moveTo(this.node.worldPosition.x, this.node.worldPosition.y);
                this._debugGraphics.strokeColor = new math.Color(255,0,0);
                this._debugGraphics.lineWidth = 20;
                
                if(0 != this._pathToPlayer.length)
                {
                    for(var pathElement of this._pathToPlayer)
                    {
                        this._debugGraphics.lineTo(pathElement.x, pathElement.y);
                    }
                }

                this._debugGraphics.stroke();
            }
        }

        determineState()
        {
            if(null != this.map)
            {
                if(false == this._FSMTransitionBlocked)
                {
                    if(this._rigidBody != null)
                    {
                        if(null != this.playerInFocus && null != this._uiTransform)
                        {
                            class Vec2Pair 
                            {
                                enemyCoord: Vec2 = new Vec2();
                                playerCoord: Vec2 = new Vec2();
                            } 

                            var checkCoordinates:Vec2Pair[] = [];

                            var firstCoordPair:Vec2Pair = new Vec2Pair();
                            var secondCoordPair:Vec2Pair = new Vec2Pair();

                            var playerWorldPos = this.playerInFocus.node.worldPosition;
                            var enemyWorldPos = this.node.worldPosition;

                            {
                                var enemyToPlayerVector = Maze_Common.toVec2(playerWorldPos.clone().subtract(this.node.worldPosition));
                                var perpendicularClockwise = Maze_Common.perpendicularClockwise(enemyToPlayerVector).normalize();
                                var perpendicularCounterClockwise = Maze_Common.perpendicularCounterClockwise(enemyToPlayerVector).normalize();
                                firstCoordPair.enemyCoord = Maze_Common.toVec2(enemyWorldPos).add(perpendicularClockwise.multiplyScalar(this._uiTransform.contentSize.x / 2 * this.node.scale.x * 1.2) );
                                secondCoordPair.enemyCoord = Maze_Common.toVec2(enemyWorldPos).add(perpendicularCounterClockwise.multiplyScalar(this._uiTransform.contentSize.x / 2 * this.node.scale.x * 1.2) );
                            }

                            {
                                var playerUITransform = this.playerInFocus.getComponent(UITransform);

                                if(null != playerUITransform)
                                {
                                    var playerToEnemyVector = Maze_Common.toVec2(this.node.worldPosition.clone().subtract(playerWorldPos));
                                    var perpendicularClockwise = Maze_Common.perpendicularClockwise(playerToEnemyVector).normalize();
                                    var perpendicularCounterClockwise = Maze_Common.perpendicularCounterClockwise(playerToEnemyVector).normalize();
                                    firstCoordPair.playerCoord = Maze_Common.toVec2(playerWorldPos).add(perpendicularCounterClockwise.multiplyScalar(playerUITransform.contentSize.x / 2 * this.playerInFocus.node.scale.x * 0.7) );
                                    secondCoordPair.playerCoord = Maze_Common.toVec2(playerWorldPos).add(perpendicularClockwise.multiplyScalar(playerUITransform.contentSize.x / 2 * this.playerInFocus.node.scale.x * 0.7) );
                                }
                            }

                            checkCoordinates.push( firstCoordPair );
                            checkCoordinates.push( secondCoordPair );

                            var visibleLines:number = 0;

                            if(null != this._debugGraphics)
                            {
                                this._debugGraphics.clear();
                            }

                            for(var coordinatePair of checkCoordinates)
                            {
                                if(null != this._debugGraphics)
                                {
                                    this._debugGraphics.strokeColor = new math.Color(255,0,0);
                                    this._debugGraphics.lineWidth = 20;
                                    this._debugGraphics.moveTo(coordinatePair.enemyCoord.x,coordinatePair.enemyCoord.y);
                                    this._debugGraphics.lineTo(coordinatePair.playerCoord.x,coordinatePair.playerCoord.y);
                                    this._debugGraphics.close();
                                    this._debugGraphics.stroke();
                                }

                                var raycastResult = this.map.raycast(coordinatePair.enemyCoord, coordinatePair.playerCoord);

                                if(false == raycastResult[0])
                                {
                                    visibleLines = visibleLines + 1;
                                }
                                else
                                {
                                    break;
                                }
                            }

                            if(visibleLines >= 2)
                            {
                                if(null != this._playerUiTransform && null != this._uiTransform)
                                {
                                    if(playerWorldPos.clone().subtract(enemyWorldPos).length() > this._maxLength)
                                    {
                                        this._FSM.applyTransition(EnemyFSMTransitions.To_ChasingPlayer);
                                    }
                                    else
                                    {
                                        this._FSM.applyTransition(EnemyFSMTransitions.To_AttackPlayer);
                                    }
                                }
                            }
                            else
                            {
                                this._FSM.applyTransition(EnemyFSMTransitions.To_BypassObstacle);
                                this.drawBypassObstaclePath();
                            }
                        }
                    }
                }
            }
            else
            {
                throw("Error! this.map == null!");
            }
        }

        update_logic(deltaTime:number)
        {
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

                if(movementVec.length() != 0)
                {
                    this._rigidBody.applyForceToCenter( Maze_Common.toVec2(movementVec), true );
                }
            }

            if(EnemyFSMStateId.Death != this._FSM.currentState &&
               EnemyFSMStateId.Destroy != this._FSM.currentState &&
               EnemyFSMStateId.Final != this._FSM.currentState)
            {
                var targetWorldCoord = new Vec3();

                if(EnemyFSMStateId.ChasingPlayer == this._FSM.currentState ||
                   EnemyFSMStateId.AttackPlayer == this._FSM.currentState)
                {
                    if(null != this.playerInFocus)
                    {
                        targetWorldCoord = this.playerInFocus.node.worldPosition;
                    }
                }
                if(EnemyFSMStateId.BypassObstacle == this._FSM.currentState ||
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

                if(Math.abs(angleDeg - this._currentAngle) > 5)
                {
                    this.node.setRotationFromEuler( 0, 0, angleDeg );
                    this._currentAngle = angleDeg;
                }
                else // work-around for native builds
                {
                    this.node.setPosition(this.node.position);
                }
            }
        }

        fadeIn()
        {
            var spineComp = this.node.getComponent( sp.Skeleton );

            if(null != spineComp)
            {
                spineComp.color.set(new Color(spineComp.color.r, spineComp.color.g, spineComp.color.b, 0));
                this._fadeInTween = tween(spineComp.color).to(2, new Color(spineComp.color.r, spineComp.color.g, spineComp.color.b, 255)).start();
            }
        }

        stopFadeIn()
        {
            if(null != this._fadeInTween)
            {
                this._fadeInTween.stop();
                this._fadeInTween = null;
            }

            var spineComp = this.node.getComponent( sp.Skeleton );

            if(null != spineComp)
            {
                spineComp.color.set(new Color(255, 255, 255, 255));
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

            if(EnemyFSMStateId.Death == this._FSM.currentState)
            {
                if(true == this._shouldNotifyDeath)
                {
                    this.deathEnemySubject.notify( new DestroyEnemyContext( this.node ) );
                    this._shouldNotifyDeath = false;
                }
            }

            if(EnemyFSMStateId.Destroy == this._FSM.currentState)
            {
                if(true == this._shouldNotifyDestroy)
                {
                    this._FSM.applyTransition(EnemyFSMTransitions.To_Final);

                    if(null != this.playerInFocus)
                    {
                        this.playerInFocus.cursorPlayerGridPositionSubject.detach(this._cursorPlayerGridPositionObserver); 
                    }

                    this.destroyEnemySubject.notify( new DestroyEnemyContext( this.node ) );
                    this._shouldNotifyDestroy = false;
                }
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