using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Spine.Unity;
using UnityEngine.SceneManagement;
using UnityEngine.Experimental.Rendering.Universal;
using Maze_MapBuilder;
using Maze_Common;
using Maze_Bar;
using Maze_FSM;
using Maze_Tween;


namespace Maze_PlayerBase
{
    using PlayerFSM = FSM<PlayerFSMStateId, PlayerFSMTransitions, PlayerFSMContext>;
    using PlayerFSMState = Maze_FSM.State<PlayerFSMStateId, PlayerFSMTransitions, PlayerFSMContext>;
    using PlayerFSMTransition = Maze_FSM.Transition<PlayerFSMStateId, PlayerFSMTransitions, PlayerFSMContext>;

    public enum eMoveDirection
    {
        RIGHT = 0,
        LEFT = 1,
        UP = 2,
        DOWN = 3
    };
    public enum PlayerFSMStateId
    {
        Idle = 0,
        Death = 1,
        Destroy = 2,
        Final = 3
    }

    public enum PlayerFSMTransitions
    {
        To_Idle = 0,
        To_Death = 1,
        To_Destroy = 2,
        To_Final = 3
    }

    public class PlayerFSMContext { }

    public class PlayerBase : MonoBehaviour
    {
        private float mInitalHealth = 0;

        [SerializeField]
        private float mHealth = 100;
        public float Health { get => mHealth; set => mHealth = value; }

        protected Vector2 mEyesDirection = new Vector2(0,1);
        public Vector2 EyesDirection { get => mEyesDirection; set => mEyesDirection = value; }

        [SerializeField]
        protected float mAcceleration = 0;
        public float Acceleration { get => mAcceleration; set => mAcceleration = value; }

        [SerializeField]
        protected float mVelocityMax = 0;
        public float VelocityMax { get => mVelocityMax; set => mVelocityMax = value; }

        [SerializeField]
        MapBuilder mMapBuilder;
        public MapBuilder MapBuilder { get => mMapBuilder; }

        [SerializeField]
        private AudioClip mShotHitsAudioClip;
        public AudioClip ShotHitsAudioClip { get => mShotHitsAudioClip; set => mShotHitsAudioClip = value; }

        [SerializeField]
        private AudioClip mDeathAudioClip;
        public AudioClip DeathHitsAudioClip { get => mDeathAudioClip; set => mDeathAudioClip = value; }

        private AudioSource mAudio;

        [SerializeField]
        private Light2D mTorchlight;
        public Light2D Torchlight { get => mTorchlight; }
        private Tween<float> mTorchlightTween = new Tween<float>();

        [SerializeField]
        private Light2D mNearbyLight;
        public Light2D NearbyLight { get => mNearbyLight; }
        private Tween<float> mNearbyLightTween = new Tween<float>();

        [SerializeField]
        private GameObject mHealthBarPrefab;

        private GameObject mHealthBarInstance;

        private Bar mHealthBarComponent;
        public Bar HealthBar { get => mHealthBarComponent; }

        protected HashSet<eMoveDirection> mMoveDirections = new HashSet<eMoveDirection>();
        public HashSet<eMoveDirection> MoveDirections { get => mMoveDirections; set => mMoveDirections = value; }

        protected float mWalkForce = 200000;
        public float WalkForce { get => mWalkForce; }

        protected SkeletonAnimation mSkeletonAnimation;
        protected eMoveDirection mCurrentMoveDirection = eMoveDirection.UP;

        protected Rigidbody2D mRigidBody;

        protected Maze_WeaponBase.WeaponBase mWeapon;
        private Spine.AnimationState.TrackEntryDelegate mHandleDeathAnimationEnding = null;

        private PlayerFSM mFSM;
        protected PlayerFSM FSM { get => mFSM; set => mFSM = value; }

        private bool mIsTurnOffCollision = false;
        private PolygonCollider2D mPolygonCollider = null;

        protected void playShotHitsSound()
        {
            if (null != mAudio && null != mShotHitsAudioClip)
            {
                mAudio.PlayOneShot(mShotHitsAudioClip);
            }
        }

        protected void playDeathSound()
        {
            if (null != mAudio && null != mDeathAudioClip)
            {
                mAudio.PlayOneShot(mDeathAudioClip);
            }
        }

        public PlayerBase()
        {
            mFSM = createFSM();
        }

        void unscheduleAllCallbacks()
        {
            if (null != mHandleDeathAnimationEnding && null != mSkeletonAnimation)
            {
                mSkeletonAnimation.state.Complete -= mHandleDeathAnimationEnding;
                mHandleDeathAnimationEnding = null;
            }
        }

        PlayerFSM createFSM()
        {
            // Declaration of FSM states
            var idleState = new PlayerFSMState(PlayerFSMStateId.Idle, (PlayerFSMContext context) =>
            {
                // enter
            },
            (PlayerFSMContext context) =>
            {
                // exit
            });

            var deathState = new PlayerFSMState(PlayerFSMStateId.Death, (PlayerFSMContext context) =>
            {
                // enter
                if (null != mRigidBody)
                {
                    mRigidBody.Sleep();
                }

                unscheduleAllCallbacks();

                if (null != mTorchlightTween && null != mTorchlight)
                {
                    mTorchlightTween.Start(mTorchlight.intensity, 0.0f, 1.0f,
                    (float initialValue, float targetValue, float duration, float durationPassed) =>
                    {
                        if (null != mTorchlight)
                        {
                            mTorchlight.intensity = initialValue + ( (targetValue - initialValue) * (durationPassed / duration) );
                        }
                    },
                    () =>
                    {
                        if (null != mTorchlight)
                        {
                            mTorchlight.intensity = 0.0f;
                        }
                    },
                    () =>
                    {
                        if (null != mTorchlight)
                        {
                            mTorchlight.intensity = 0.0f;
                        }
                    });
                }

                if (null != mNearbyLightTween && null != mNearbyLight)
                {
                    mNearbyLightTween.Start(mNearbyLight.intensity, 0.0f, 1.0f,
                    (float initialValue, float targetValue, float duration, float durationPassed) =>
                    {
                        if (null != mNearbyLight)
                        {
                            mNearbyLight.intensity = initialValue + ((targetValue - initialValue) * (durationPassed / duration));
                        }
                    },
                    () =>
                    {
                        if (null != mNearbyLight)
                        {
                            mNearbyLight.intensity = 0.0f;
                        }
                    },
                    () =>
                    {
                        if (null != mNearbyLight)
                        {
                            mNearbyLight.intensity = 0.0f;
                        }
                    });
                }

                if (mSkeletonAnimation != null)
                {
                    mSkeletonAnimation.state.SetAnimation(0, "death", false);
                    playDeathSound();

                    mHandleDeathAnimationEnding = (Spine.TrackEntry x) =>
                    {
                        if (x.Animation.Name == "death")
                        {
                            mFSM.ApplyTransition(PlayerFSMTransitions.To_Destroy);

                            if (null != mSkeletonAnimation)
                            {
                                mSkeletonAnimation.state.Complete -= mHandleDeathAnimationEnding;
                                mHandleDeathAnimationEnding = null;
                            }
                        }
                    };

                    mSkeletonAnimation.state.Complete += mHandleDeathAnimationEnding;

                    mIsTurnOffCollision = true;

                    if(null != mWeapon)
                    {
                        mWeapon.fireOff();
                    }
                }
            },
            (PlayerFSMContext context) =>
            {
                // exit
            });

            var destroyState = new PlayerFSMState(PlayerFSMStateId.Destroy, (PlayerFSMContext context) =>
            {
                if (null != mRigidBody)
                {
                    mRigidBody.Sleep();
                }

                SceneManager.LoadScene(SceneManager.GetActiveScene().name);
            },
            (PlayerFSMContext context) =>
            {
                // exit
            });

            var finalState = new PlayerFSMState(PlayerFSMStateId.Final, (PlayerFSMContext context) =>
            {
                // enter
                if (null != mRigidBody)
                {
                    mRigidBody.Sleep();
                }
            },
            (PlayerFSMContext context) =>
            {
                // exit
            });

            // Declaration of transitions

            var From_Idle_To_DeathTransition = new PlayerFSMTransition(PlayerFSMTransitions.To_Death, idleState, deathState);

            var From_Death_To_DestroyTransition = new PlayerFSMTransition(PlayerFSMTransitions.To_Destroy, deathState, destroyState);
            var From_Destroy_To_FinalTransition = new PlayerFSMTransition(PlayerFSMTransitions.To_Final, destroyState, finalState);

            var From_Final_To_IdleTransition = new PlayerFSMTransition(PlayerFSMTransitions.To_Idle, finalState, idleState);

            // Assignment of transitions to states
            idleState.AddTransition(From_Idle_To_DeathTransition);

            deathState.AddTransition(From_Death_To_DestroyTransition);

            destroyState.AddTransition(From_Destroy_To_FinalTransition);

            finalState.AddTransition(From_Final_To_IdleTransition);

            // Creation of FSM
            return new PlayerFSM(idleState);
        }
        public bool IsAlive()
        {
            return mFSM.CurrentState.StateId == PlayerFSMStateId.Idle;
        }

        public void OnMoveUpStart()
        {
            if (true == IsAlive())
            {
                mCurrentMoveDirection = eMoveDirection.UP;
                startMovement();
            }
        }

        public void OnMoveUpFinish()
        {
            if (true == IsAlive())
            {
                mMoveDirections.Remove(eMoveDirection.UP);
                finishMovement();
            }
        }

        public void OnMoveDownStart()
        {
            if (true == IsAlive())
            {
                mCurrentMoveDirection = eMoveDirection.DOWN;
                startMovement();
            }
        }

        public void OnMoveDownFinish()
        {
            if (true == IsAlive())
            {
                mMoveDirections.Remove(eMoveDirection.DOWN);
                finishMovement();
            }
        }

        public void OnMoveLeftStart()
        {
            if (true == IsAlive())
            {
                mCurrentMoveDirection = eMoveDirection.LEFT;
                startMovement();
            }
        }

        public void OnMoveLeftFinish()
        {
            if (true == IsAlive())
            {
                mMoveDirections.Remove(eMoveDirection.LEFT);
                finishMovement();
            }
        }

        public void OnMoveRightStart()
        {
            if (true == IsAlive())
            {
                mCurrentMoveDirection = eMoveDirection.RIGHT;
                startMovement();
            }
        }

        public void OnMoveRightFinish()
        {
            if (true == IsAlive())
            {
                mMoveDirections.Remove(eMoveDirection.RIGHT);
                finishMovement();
            }
        }

        public void OnFireOn()
        {
            if(true == IsAlive() && null != mWeapon)
            {
                mWeapon.fireOn();
            }
        }

        public void OnFireOff()
        {
            if(true == IsAlive() && null != mWeapon)
            {
                mWeapon.fireOff();
            }
        }

        void OnEnable()
        {
            if (null != mHealthBarInstance)
            {
                mHealthBarInstance.SetActive(true);
            }
        }

        void OnDisable()
        {
            if (null != mHealthBarInstance)
            {
                mHealthBarInstance.SetActive(false);
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

                    playShotHitsSound();
                    mHealth -= bullet.Damage;

                    if (null != mHealthBarComponent)
                    {
                        mHealthBarComponent.SetValue(mHealth / mInitalHealth * 100);
                    }

                    if (mHealth <= 0)
                    {
                        mHealth = 0;
                        mFSM.ApplyTransition(PlayerFSMTransitions.To_Death);
                    }
                }
            }
        }

        // Start is called before the first frame update
        public void Start()
        {
            mAudio = GetComponent<AudioSource>();

            mInitalHealth = mHealth;

            if (null != mHealthBarPrefab)
            {
                mHealthBarInstance = Instantiate(mHealthBarPrefab);

                if (null != mHealthBarInstance)
                {
                    mHealthBarInstance.transform.position = transform.position + new Vector3(0, 2.0f, 0);
                    mHealthBarInstance.transform.SetParent(transform.parent);
                    mHealthBarComponent = mHealthBarInstance.GetComponent<Bar>();

                    if (null != mHealthBarComponent)
                    {
                        mHealthBarComponent.SetValue(mHealth / mInitalHealth * 100);
                    }
                }
            }

            mSkeletonAnimation = GetComponent<SkeletonAnimation>() as SkeletonAnimation;

            if (mSkeletonAnimation != null)
            {
                mSkeletonAnimation.state.SetAnimation(0, "idle", true);
                
                if(null != mSkeletonAnimation.skeleton)
                {
                    mSkeletonAnimation.skeleton.R = 255;
                }
            }

            mWeapon = GetComponent<Maze_WeaponBase.WeaponBase>();
            mPolygonCollider = GetComponent<PolygonCollider2D>();

            mRigidBody = GetComponent<Rigidbody2D>();

            if (null != mMapBuilder)
            {
                var walkableTiles = mMapBuilder.filterTiles2(new RectInt(0, 0, mMapBuilder.Width, mMapBuilder.Height));

                var creationTileIndex = Common.randomRangeInt(0, walkableTiles.Count);
                var creationTile = walkableTiles[creationTileIndex];

                Vector2 creationPos = mMapBuilder.tileToPoint(creationTile);
                transform.position = new Vector3(creationPos.x, creationPos.y, 0);
            }

            mFSM.init();
        }

        private void startMovement()
        {
            mMoveDirections.Add(mCurrentMoveDirection);

            if (mSkeletonAnimation != null)
            {
                mSkeletonAnimation.state.SetAnimation(0, "run", true);
            }
        }

        private void finishMovement()
        {
            if (0 == mMoveDirections.Count)
            {
                if (mSkeletonAnimation != null)
                {
                    mSkeletonAnimation.state.SetAnimation(0, "idle", true);
                }
            }
        }

        protected Vector3 Direction
        {
            get
            {
                Vector3 result = new Vector3();
                result = transform.rotation * EyesDirection;
                return result;
            }
        }

        void update_HandlingDelayedActions()
        {
            // handling delayed actions

            if (true == mIsTurnOffCollision)
            {
                if (mPolygonCollider != null)
                {
                    mPolygonCollider.enabled = false;
                    mIsTurnOffCollision = false;
                }
            }
        }
        protected void Update()
        {
            if (null != mHealthBarInstance)
            {
                mHealthBarInstance.transform.position = transform.position + new Vector3(0, 2.0f, 0);
            }

            if(null != mTorchlightTween)
            {
                mTorchlightTween.Update(Time.deltaTime);
            }

            if (null != mNearbyLightTween)
            {
                mNearbyLightTween.Update(Time.deltaTime);
            }

            update_HandlingDelayedActions();
        }
    }
}
