using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Spine.Unity;
using Maze_MapBuilder;
using Maze_Common;

namespace Maze_PlayerBase
{
    public enum eMoveDirection
    {
        RIGHT = 0,
        LEFT = 1,
        UP = 2,
        DOWN = 3
    };

    public class PlayerBase : MonoBehaviour
    {
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

        protected HashSet<eMoveDirection> mMoveDirections = new HashSet<eMoveDirection>();
        public HashSet<eMoveDirection> MoveDirections { get => mMoveDirections; set => mMoveDirections = value; }

        protected float mWalkForce = 2000;
        public float WalkForce { get => mWalkForce; }

        protected SkeletonAnimation mSkeletonAnimation;
        protected eMoveDirection mCurrentMoveDirection = eMoveDirection.UP;

        protected Rigidbody2D mRigidBody;

        protected Maze_WeaponBase.WeaponBase mWeapon;

        public void OnMoveUpStart()
        {
            mCurrentMoveDirection = eMoveDirection.UP;
            startMovement();
        }

        public void OnMoveUpFinish()
        {
            mMoveDirections.Remove(eMoveDirection.UP);
            finishMovement();
        }

        public void OnMoveDownStart()
        {
            mCurrentMoveDirection = eMoveDirection.DOWN;
            startMovement();
        }

        public void OnMoveDownFinish()
        {
            mMoveDirections.Remove(eMoveDirection.DOWN);
            finishMovement();
        }

        public void OnMoveLeftStart()
        {
            mCurrentMoveDirection = eMoveDirection.LEFT;
            startMovement();
        }

        public void OnMoveLeftFinish()
        {
            mMoveDirections.Remove(eMoveDirection.LEFT);
            finishMovement();
        }

        public void OnMoveRightStart()
        {
            mCurrentMoveDirection = eMoveDirection.RIGHT;
            startMovement();
        }

        public void OnMoveRightFinish()
        {
            mMoveDirections.Remove(eMoveDirection.RIGHT);
            finishMovement();
        }

        public void OnFireOn()
        {
            if(null != mWeapon)
            {
                mWeapon.fireOn();
            }
        }

        public void OnFireOff()
        {
            if(null != mWeapon)
            {
                mWeapon.fireOff();
            }
        }

        // Start is called before the first frame update
        public void Start()
        {
            mSkeletonAnimation = GetComponent<SkeletonAnimation>() as SkeletonAnimation;

            if (mSkeletonAnimation != null)
            {
                mSkeletonAnimation.state.SetAnimation(0, "idle", true);
            }

            mWeapon = GetComponent<Maze_WeaponBase.WeaponBase>();

            mRigidBody = GetComponent<Rigidbody2D>();

            if (null != mMapBuilder)
            {
                var walkableTiles = mMapBuilder.filterTiles2(new RectInt(0, 0, mMapBuilder.Width, mMapBuilder.Height));

                var creationTileIndex = Common.randomRangeInt(0, walkableTiles.Count);
                var creationTile = walkableTiles[creationTileIndex];

                Vector2 creationPos = mMapBuilder.tileToPoint(creationTile);
                transform.position = new Vector3(creationPos.x, creationPos.y, 0);
            }
        }

        private void startMovement()
        {
            this.mMoveDirections.Add(mCurrentMoveDirection);

            if (mSkeletonAnimation != null)
            {
                mSkeletonAnimation.state.SetAnimation(0, "run", true);
            }
        }

        private void finishMovement()
        {
            if (0 == this.mMoveDirections.Count)
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
                result = this.transform.rotation * this.EyesDirection;
                return result;
            }
        }
    }
}
