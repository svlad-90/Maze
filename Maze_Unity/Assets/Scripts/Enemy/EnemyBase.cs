using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityTimer;
using Unity.Mathematics;
using Spine.Unity;
using Maze_PlayerCursor;
using Maze_Common;
using Maze_FSM;
using Maze_MapBuilder;
using Maze_Observer;
using Maze_Wall;
using Maze_DebugGraphics;

namespace Maze_EnemyBase
{
    using EnemyFSM = FSM<EnemyFSMStateId, EnemyFSMTransitions, EnemyFSMContext>;
    using EnemyFSMState = Maze_FSM.State<EnemyFSMStateId, EnemyFSMTransitions, EnemyFSMContext>;
    using EnemyFSMTransition = Maze_FSM.Transition<EnemyFSMStateId, EnemyFSMTransitions, EnemyFSMContext>;

    public class DestroyEnemyContext
    {
        public DestroyEnemyContext(GameObject enemy)
        {
            mEnemy = enemy;
        }
        GameObject mEnemy;
        public GameObject Enemy { get => mEnemy; }
    }

    public class DeathEnemyContext
    {
        public DeathEnemyContext(GameObject enemy)
        {
            mEnemy = enemy;
        }
        GameObject mEnemy;
        public GameObject Enemy { get => mEnemy; }
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

    class EnemyFSMContext{}

    public class EnemyBase : MonoBehaviour
    {
        [SerializeField]
        private float mHealth = 100;
        public float Health { get => mHealth; set => mHealth = value; }

        [SerializeField]
        private PlayerCursor mPlayerInFocus = null;
        public PlayerCursor PlayerInFocus { get => mPlayerInFocus; set => mPlayerInFocus = value; }

        [SerializeField]
        Vector3 mEyesDirection = new Vector3(0,1,0);
        public Vector3 EyesDirection { get => mEyesDirection; }

        [SerializeField]
        float mAcceleration = 0;
        public float Acceleration { get => mAcceleration; set => mAcceleration = value; }

        [SerializeField]
        float mVelocityMax = 0;
        public float VelocityMax { get => mVelocityMax; set => mVelocityMax = value; }

        [SerializeField]
        bool mDebug = false;
        public bool Debug { get => mDebug; set => mDebug = value; }

        private Subject<DestroyEnemyContext>  mDestroyEnemySubject = new Subject<DestroyEnemyContext>();
        public Subject<DestroyEnemyContext> DestroyEnemySubject { get => mDestroyEnemySubject; set => mDestroyEnemySubject = value; }

        private Subject<DeathEnemyContext>  mDeathEnemySubject = new Subject<DeathEnemyContext>();
        public Subject<DeathEnemyContext> DeathEnemySubject { get => mDeathEnemySubject; set => mDeathEnemySubject = value; }

        private MapBuilder mMap = null;
        public MapBuilder Map { get => mMap; set => mMap = value; }

        private float mWalkForce = 200000;
        public float WalkForce { get => mWalkForce; }

        private float mInitalHealth = 0;
        private bool mShouldNotifyDeath = false;
        private bool mShouldNotifyDestroy = false;
        private bool mFSMTransitionBlocked = false;
        private Observer<Maze_PlayerCursor.CursorPlayerGridPositionContext>  mCursorPlayerGridPositionObserver = new Observer<Maze_PlayerCursor.CursorPlayerGridPositionContext>();
        private DebugGraphics mDebugGraphics = null;
        private MeshRenderer mMeshRenderer = null;
        private float mCurrentAngle = 0;
        private Rigidbody2D mRigidBody = null;
        private CircleCollider2D mCircleCollider = null;
        private bool mIsTurnOffCollision = false;
        private EnemyFSM mFSM;
        private List<Vector2> mPathToPlayer = new List<Vector2>();
        private float mMaxLength = 0;
        private UnityTimer.Timer mDetermineStateTimer = null;
        private UnityTimer.Timer mFSMBlockedTimer = null;
        protected SkeletonAnimation mSkeletonAnimation;
        private Spine.AnimationState.TrackEntryDelegate mHandleDeathAnimationEnding = null;
        private RectTransform mPlayerRectTransform;
        private RectTransform mRectTransform;

        private void startFire()
        {
            if (null != mPlayerInFocus)
            {
                var weapon = GetComponent<Maze_WeaponTarget.WeaponTarget>();

                if (null != weapon)
                {
                    if (true == weapon.FireAllowed)
                    {
                        weapon.Target = PlayerInFocus.gameObject;
                        weapon.fireOn();
                    }
                }
            }
        }

        private void stopFire()
        {
            var weapon = GetComponent<Maze_WeaponTarget.WeaponTarget>();
            if (null != weapon)
            {
                weapon.fireOff();
            }
        }
        void unscheduleAllCallbacks()
        {
            if(null != mFSMBlockedTimer)
            {
                Timer.Cancel(mFSMBlockedTimer);
                mFSMBlockedTimer = null;
            }

            if (null != mDetermineStateTimer)
            {
                Timer.Cancel(mDetermineStateTimer);
                mDetermineStateTimer = null;
            }

            if(null != mHandleDeathAnimationEnding && null != mSkeletonAnimation)
            {
                mSkeletonAnimation.state.Complete -= mHandleDeathAnimationEnding;
                mHandleDeathAnimationEnding = null;
            }
        }

        EnemyFSM createFSM()
        {
            // Declaration of FSM states
            var idleState = new EnemyFSMState(EnemyFSMStateId.Idle, (EnemyFSMContext context) =>
            {
                // enter
                if(null != mRigidBody)
                {
                    mRigidBody.Sleep();
                }

                mDetermineStateTimer = Timer.Register(0.1f, () =>
                {
                    determineState();
                }, (float param)=>{}, true);

                if (null != mPlayerInFocus)
                {
                    mCursorPlayerGridPositionObserver.setObserverCallback((CursorPlayerGridPositionContext data) => 
                    {
                        if (EnemyFSMStateId.BypassObstacle == mFSM.CurrentState.StateId ||
                           EnemyFSMStateId.BypassObstacleCorner == mFSM.CurrentState.StateId)
                        {
                            updatePathToPlayer();
                        }
                    });

                    mPlayerInFocus.CursorPlayerGridPositionSubject.attach(mCursorPlayerGridPositionObserver);
                }

                if (mSkeletonAnimation != null)
                {
                    mSkeletonAnimation.state.SetAnimation(0, "idle", true);
                }
            }, 
            (EnemyFSMContext context) =>
            {
                // exit
            });

            var chasingPlayerState = new EnemyFSMState(EnemyFSMStateId.ChasingPlayer, (EnemyFSMContext context) =>
            {
                if(null != mRigidBody)
                { 
                    mRigidBody.WakeUp();
                }

                if (mSkeletonAnimation != null)
                {
                    mSkeletonAnimation.state.SetAnimation(0, "run", true);
                }

                startFire();
            }, 
            (EnemyFSMContext context) =>
            {
                // exit
            });

            var attackPlayerState = new EnemyFSMState(EnemyFSMStateId.AttackPlayer, (EnemyFSMContext context) =>
            {
                if(null != mRigidBody)
                {
                    mRigidBody.Sleep();
                    mRigidBody.velocity = new Vector2(0, 0);
                }

                if (mSkeletonAnimation != null)
                {
                    mSkeletonAnimation.state.SetAnimation(0, "idle", false);
                }

                startFire();
            }, 
            (EnemyFSMContext context) =>
            {
                // exit
            });

            var bypassObstacleState = new EnemyFSMState(EnemyFSMStateId.BypassObstacle, (EnemyFSMContext context) =>
            {
                if(null != mRigidBody)
                {
                    mRigidBody.WakeUp();
                }

                if (mSkeletonAnimation != null)
                {
                    mSkeletonAnimation.state.SetAnimation(0, "run", true);
                }

                updatePathToPlayer();

                stopFire();
            }, 
            (EnemyFSMContext context) =>
            {
                // exit
            });

            var bypassObstacleCornerState = new EnemyFSMState(EnemyFSMStateId.BypassObstacleCorner, (EnemyFSMContext context) =>
            {
                if(null != mRigidBody)
                {                    
                    mRigidBody.WakeUp();
                }

                if (mSkeletonAnimation != null)
                {
                    mSkeletonAnimation.state.SetAnimation(0, "run", true);
                }

                updatePathToPlayer();

                mFSMTransitionBlocked = true;

                mFSMBlockedTimer = Timer.Register(0.25f, () =>
                {
                    mFSMTransitionBlocked = false;
                });
            }, 
            (EnemyFSMContext context) =>
            {
                // exit
            });

            var deathState = new EnemyFSMState(EnemyFSMStateId.Death, (EnemyFSMContext context) =>
            {
                // enter
                if (null != mRigidBody)
                {
                    mRigidBody.Sleep();
                }

                mShouldNotifyDeath = true;
                unscheduleAllCallbacks();

                if (mSkeletonAnimation != null)
                {
                    mSkeletonAnimation.state.SetAnimation(0, "death", false);

                    mHandleDeathAnimationEnding = (Spine.TrackEntry x) =>
                    {
                        if (x.Animation.Name == "death")
                        {
                            mFSM.ApplyTransition(EnemyFSMTransitions.To_Destroy);

                            if (null != mSkeletonAnimation)
                            {
                                mSkeletonAnimation.state.Complete -= mHandleDeathAnimationEnding;
                                mHandleDeathAnimationEnding = null;
                            }
                        }
                    };

                    mSkeletonAnimation.state.Complete += mHandleDeathAnimationEnding;

                    mIsTurnOffCollision = true;

                    stopFire();

                    if (null != mDebugGraphics)
                    {
                        mDebugGraphics.clear();
                    }
                }
            }, 
            (EnemyFSMContext context) =>
            {
                // exit
            });

            var destroyState = new EnemyFSMState(EnemyFSMStateId.Destroy, (EnemyFSMContext context) =>
            {
                if(null != mRigidBody)
                {
                    mRigidBody.Sleep();
                }

                stopFadeIn();
                mShouldNotifyDestroy = true;
            }, 
            (EnemyFSMContext context) =>
            {
                // exit
            });

            var finalState = new EnemyFSMState(EnemyFSMStateId.Final, (EnemyFSMContext context) =>
            {
                // enter
                if(null != mRigidBody)
                {
                    mRigidBody.Sleep();
                }
            },
            (EnemyFSMContext context) =>
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

            idleState.AddTransition(From_Idle_To_ChasingPlayerTransition);
            idleState.AddTransition(From_Idle_To_AttackPlayerTransition);
            idleState.AddTransition(From_Idle_To_BypassObstacleTransition);
            idleState.AddTransition(From_Idle_To_BypassObstacleCornerTransition);
            idleState.AddTransition(From_Idle_To_DeathTransition);

            chasingPlayerState.AddTransition(From_ChasingPlayer_To_IdleTransition);
            chasingPlayerState.AddTransition(From_ChasingPlayer_To_AttackPlayerTransition);
            chasingPlayerState.AddTransition(From_ChasingPlayer_To_BypassObstacleTransition);
            chasingPlayerState.AddTransition(From_ChasingPlayer_To_BypassObstacleCornerTransition);
            chasingPlayerState.AddTransition(From_ChasingPlayer_To_DeathTransition);

            attackPlayerState.AddTransition(From_AttackPlayer_To_IdleTransition);
            attackPlayerState.AddTransition(From_AttackPlayer_To_ChasingPlayerTransition);
            attackPlayerState.AddTransition(From_AttackPlayer_To_BypassObstacleTransition);
            attackPlayerState.AddTransition(From_AttackPlayer_To_BypassObstacleCornerTransition);
            attackPlayerState.AddTransition(From_AttackPlayer_To_DeathTransition);

            bypassObstacleState.AddTransition(From_BypassObstacle_To_IdleTransition);
            bypassObstacleState.AddTransition(From_BypassObstacle_To_ChasingPlayerTransition);
            bypassObstacleState.AddTransition(From_BypassObstacle_To_AttackPlayerTransition);
            bypassObstacleState.AddTransition(From_BypassObstacle_To_BypassObstacleCornerTransition);
            bypassObstacleState.AddTransition(From_BypassObstacle_To_DeathTransition);

            bypassObstacleCornerState.AddTransition(From_BypassObstacleCorner_To_IdleTransition);
            bypassObstacleCornerState.AddTransition(From_BypassObstacleCorner_To_ChasingPlayerTransition);
            bypassObstacleCornerState.AddTransition(From_BypassObstacleCorner_To_AttackPlayerTransition);
            bypassObstacleCornerState.AddTransition(From_BypassObstacleCorner_To_BypassObstacleTransition);
            bypassObstacleCornerState.AddTransition(From_BypassObstacleCorner_To_DeathTransitionTransition);

            deathState.AddTransition(From_Death_To_DestroyTransition);

            destroyState.AddTransition(From_Destroy_To_FinalTransition);

            finalState.AddTransition(From_Final_To_IdleTransition);

            // Creation of FSM
            return new EnemyFSM(idleState);
        }

        EnemyBase()
        {
            mFSM = createFSM();
        }

        // Start is called before the first frame update
        void Start()
        {
            if (true == mDebug)
            {
                mDebugGraphics = new DebugGraphics(gameObject.transform.parent);
            }

            mRectTransform = GetComponent<RectTransform>();
            mRigidBody = GetComponent<Rigidbody2D>();
            mCircleCollider = GetComponent<CircleCollider2D>();
            mSkeletonAnimation = GetComponent<SkeletonAnimation>();
            mMeshRenderer = GetComponent<MeshRenderer>();

            mInitalHealth = mHealth;

            if (null != mPlayerInFocus)
            {
                mPlayerRectTransform = mPlayerInFocus.GetComponent<RectTransform>();

                if (null != mPlayerRectTransform && null != mRectTransform)
                {
                    mMaxLength = mPlayerRectTransform.sizeDelta.y * transform.lossyScale.y / 2 + mRectTransform.sizeDelta.y * mPlayerInFocus.transform.lossyScale.y / 2 + 1;
                }
            }

            mFSM.init();
            mFSM.ApplyTransition(EnemyFSMTransitions.To_BypassObstacle);
        }

        private bool mReused = false;

        public void reuse()
        {
            if (true == mReused)
            {
                mHealth = mInitalHealth;
                mFSM.restart();
                mFSM.ApplyTransition(EnemyFSMTransitions.To_Idle);
                mFSM.ApplyTransition(EnemyFSMTransitions.To_BypassObstacle);

                if (mCircleCollider != null)
                {
                    mCircleCollider.enabled = true;
                }
            }
            else
            {
                mReused = true;
            }
        }

        void OnCollisionEnter2D(Collision2D collision)
        {
            var bullet = collision.collider.GetComponent<Maze_BulletBase.BulletBase>();

            if (null != bullet)
            {
                if (true == bullet.IsDamageActive)
                {
                    bullet.deactivate();

                    mHealth -= bullet.Damage;

                    if (mHealth <= 0)
                    {
                        mFSM.ApplyTransition(EnemyFSMTransitions.To_Death);
                    }
                }
            }

            var wall = collision.collider.GetComponent<Wall>();

            if (null != wall)
            {
                mFSM.ApplyTransition(EnemyFSMTransitions.To_BypassObstacleCorner);
            }
        }

        void drawBypassObstaclePath()
        {
            if (null != mDebugGraphics)
            {
                //mDebugGraphics.clear();

                if (0 != mPathToPlayer.Count)
                {
                    foreach (var pathElement in mPathToPlayer)
                    {
                        mDebugGraphics.addVertex(pathElement);
                    }
                }

                mDebugGraphics.draw();
            }
        }

        private Vector3 getMovementVec()
        {
            var movementVec = new Vector3();

            if (EnemyFSMStateId.ChasingPlayer == mFSM.CurrentState.StateId)
            {
                if (null != mPlayerInFocus)
                {
                    var playerPositionWorldCoord = Common.clone(mPlayerInFocus.transform.position);
                    Vector3 directionToPlayerWorldCoord = playerPositionWorldCoord - transform.position;
                    directionToPlayerWorldCoord.Normalize();

                    movementVec.x = directionToPlayerWorldCoord.x* mAcceleration * mWalkForce;
                                movementVec.y = directionToPlayerWorldCoord.y * mAcceleration * mWalkForce;
                }
            }
            else if (EnemyFSMStateId.BypassObstacle == mFSM.CurrentState.StateId ||
                    EnemyFSMStateId.BypassObstacleCorner == mFSM.CurrentState.StateId)
            {
                if (null != mMap)
                {
                    if (0 != mPathToPlayer.Count)
                    {
                        var vecLength = (Common.clone(mPathToPlayer[0]) - Common.toVec2(transform.position)).magnitude;

                        if (math.abs(vecLength) < 10)
                        {
                            mPathToPlayer.RemoveAt(0);
                        }

                        if (0 != mPathToPlayer.Count)
                        {
                            var directionToPlayerWorldCoord = Common.clone(mPathToPlayer[0]) - Common.toVec2(transform.position);
                            directionToPlayerWorldCoord.Normalize();

                            movementVec.x = directionToPlayerWorldCoord.x * mAcceleration * mWalkForce;
                            movementVec.y = directionToPlayerWorldCoord.y * mAcceleration * mWalkForce;
                        }
                    }
                }
            }

            return movementVec;
        }

        void updatePathToPlayer()
        {
            if (null != mMap && null != mPlayerInFocus)
            {
                mPathToPlayer = mMap.findPath(mMap.pointToTile(Common.toVec2(transform.position)), mMap.pointToTile(Common.toVec2(mPlayerInFocus.transform.position)));

                drawBypassObstaclePath();
            }
        }

        public void fadeIn()
        {
            if (null != mSkeletonAnimation && null != mSkeletonAnimation.skeleton)
            {
                //TODO
            }
        }

        void stopFadeIn()
        {
            //TODO
        }

        class Vec2Pair
        {
            public Vector2 enemyCoord = new Vector2();
            public Vector2 playerCoord = new Vector2();
        }

        void determineState()
        {
            if (null != mMap)
            {
                if (false == mFSMTransitionBlocked)
                {
                    if (mRigidBody != null && null != mRectTransform)
                    {
                        if (null != mPlayerInFocus)
                        {
                            List<Vec2Pair> checkCoordinates = new List<Vec2Pair>();
                            Vec2Pair firstCoordPair = new Vec2Pair();
                            Vec2Pair secondCoordPair = new Vec2Pair();

                            var playerWorldPos = mPlayerInFocus.transform.position;
                            var enemyWorldPos = transform.position;

                            {
                                var enemyToPlayerVector = Common.toVec2(Common.clone(playerWorldPos) - transform.position);
                                var perpendicularClockwise = Common.perpendicularClockwise(enemyToPlayerVector);
                                perpendicularClockwise.Normalize();
                                var perpendicularCounterClockwise = Common.perpendicularCounterClockwise(enemyToPlayerVector);
                                perpendicularCounterClockwise.Normalize();
                                firstCoordPair.enemyCoord = Common.toVec2(enemyWorldPos) + (perpendicularClockwise * (mRectTransform.sizeDelta.x / 2 * transform.lossyScale.x* 1.2f));
                                secondCoordPair.enemyCoord = Common.toVec2(enemyWorldPos) + (perpendicularCounterClockwise * (mRectTransform.sizeDelta.x / 2 * transform.lossyScale.x* 1.2f));
                            }

                            {
                                if (null != mPlayerRectTransform)
                                {
                                    var playerToEnemyVector = Common.toVec2(Common.clone(transform.position) - playerWorldPos);
                                    var perpendicularClockwise = Common.perpendicularClockwise(playerToEnemyVector);
                                    perpendicularClockwise.Normalize();
                                    var perpendicularCounterClockwise = Common.perpendicularCounterClockwise(playerToEnemyVector);
                                    perpendicularCounterClockwise.Normalize();
                                    firstCoordPair.playerCoord = Common.toVec2(playerWorldPos) + (perpendicularCounterClockwise * (mRectTransform.sizeDelta.x / 2 * transform.lossyScale.x * 0.7f));
                                    secondCoordPair.playerCoord = Common.toVec2(playerWorldPos) + (perpendicularClockwise * (mRectTransform.sizeDelta.x / 2 * transform.lossyScale.x * 0.7f));
                                }
                            }

                            checkCoordinates.Add(firstCoordPair);
                            checkCoordinates.Add(secondCoordPair);

                            int visibleLines = 0;

                            foreach(var coordinatePair in checkCoordinates)
                            {
                                var raycastResult = mMap.raycast(coordinatePair.enemyCoord, coordinatePair.playerCoord);

                                if (false == raycastResult.Item1)
                                {
                                    visibleLines = visibleLines + 1;
                                }
                                else
                                {
                                    break;
                                }
                            }

                            if (visibleLines >= 2)
                            {
                                if ((Common.clone(playerWorldPos) - enemyWorldPos).magnitude > mMaxLength)
                                {
                                    mFSM.ApplyTransition(EnemyFSMTransitions.To_ChasingPlayer);
                                }
                                else
                                {
                                    mFSM.ApplyTransition(EnemyFSMTransitions.To_AttackPlayer);
                                }
                            }
                            else
                            {
                                mFSM.ApplyTransition(EnemyFSMTransitions.To_BypassObstacle);
                                drawBypassObstaclePath();
                            }
                        }
                    }
                }
            }
            else
            {
                throw new System.Exception("[EnemyBase][determineState] Error! map == null!");
            }
        }

        void update_logic()
        {
            if (null != mRigidBody)
            {
                var movementVec = getMovementVec();

                if (mRigidBody.velocity.x < mVelocityMax ||
                    mRigidBody.velocity.x > -mVelocityMax)
                {
                    movementVec.x *= Time.deltaTime;
                }
                else
                {
                    movementVec.x = 0;
                }

                if (mRigidBody.velocity.y < mVelocityMax ||
                    mRigidBody.velocity.y > -mVelocityMax)
                {
                    movementVec.y *= Time.deltaTime;
                }
                else
                {
                    movementVec.y = 0;
                }

                if (movementVec.magnitude != 0)
                {
                    mRigidBody.AddForce(Common.toVec2(movementVec));
                }
            }

            if (EnemyFSMStateId.Death != mFSM.CurrentState.StateId &&
               EnemyFSMStateId.Destroy != mFSM.CurrentState.StateId &&
               EnemyFSMStateId.Final != mFSM.CurrentState.StateId)
            {
                var targetWorldCoord = new Vector3();

                if (EnemyFSMStateId.ChasingPlayer == mFSM.CurrentState.StateId ||
                   EnemyFSMStateId.AttackPlayer == mFSM.CurrentState.StateId)
                {
                    if (null != mPlayerInFocus)
                    {
                        targetWorldCoord = mPlayerInFocus.transform.position;
                    }
                }
                if (EnemyFSMStateId.BypassObstacle == mFSM.CurrentState.StateId ||
                        EnemyFSMStateId.BypassObstacleCorner == mFSM.CurrentState.StateId)
                {
                    if (0 != mPathToPlayer.Count)
                    {
                        targetWorldCoord = Common.toVec3(mPathToPlayer[0]);
                    }
                }

                var nodeWorldCoord = transform.position;

                var lookAtVec = new Vector2();

                lookAtVec.x = targetWorldCoord.x - nodeWorldCoord.x;
                lookAtVec.y = targetWorldCoord.y - nodeWorldCoord.y;

                var eyeDirection2D = new Vector2(mEyesDirection.x, mEyesDirection.y);
                var angleDeg = math.floor(Common.signAngle(eyeDirection2D,lookAtVec));

                if (math.abs(angleDeg - mCurrentAngle) > 5)
                {
                    gameObject.transform.eulerAngles = new Vector3(0, 0, angleDeg);
                    mCurrentAngle = angleDeg;
                }
                else // work-around for native builds
                {
                    transform.position = transform.position;
                }
            }
        }

        void update_HandlingDelayedActions()
        {
            // handling delayed actions

            if (true == mIsTurnOffCollision)
            {
                if (mCircleCollider != null)
                {
                    mCircleCollider.enabled = false;
                    mIsTurnOffCollision = false;
                }
            }

            if (EnemyFSMStateId.Death == mFSM.CurrentState.StateId)
            {
                if (true == mShouldNotifyDeath)
                {
                    mDeathEnemySubject.notify(new DeathEnemyContext(gameObject));
                    mShouldNotifyDeath = false;
                }
            }

            if (EnemyFSMStateId.Destroy == mFSM.CurrentState.StateId)
            {
                if (true == mShouldNotifyDestroy)
                {
                    mFSM.ApplyTransition(EnemyFSMTransitions.To_Final);

                    if (null != mPlayerInFocus)
                    {
                        mPlayerInFocus.CursorPlayerGridPositionSubject.detach(mCursorPlayerGridPositionObserver);
                    }

                    mDestroyEnemySubject.notify(new DestroyEnemyContext(gameObject));
                    mShouldNotifyDestroy = false;
                }
            }
        }

        // Update is called once per frame
        void Update()
        {
            if (true == gameObject.activeSelf)
            {
                update_logic();
                update_HandlingDelayedActions();
            }
        }
    }
}